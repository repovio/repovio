import { access, readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { verifyOpenApiArchive } from './openapi.mjs';

/** Read the canonical locale registry shared by documentation and its website consumer. */
export async function readLocales(root = '.') {
  const locales = JSON.parse(await readFile(resolve(root, 'locales.json'), 'utf8'));
  if (
    !locales.en ||
    !locales.de ||
    Object.keys(locales).some(
      /** Check whether an entry matches `!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(code)`. */ (code) =>
        !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(code),
    )
  ) {
    throw new Error('Invalid documentation locales');
  }
  for (const locale of Object.values(locales)) {
    if (!locale.name || !locale.collection || !['ltr', 'rtl'].includes(locale.dir)) {
      throw new Error('Invalid locale metadata');
    }
  }
  return locales;
}

/** Verify version/locale coverage, navigation, frontmatter, technical examples, local links, and image references. */
export async function checkDocs(root = '.', { assetRoot, previewAssetRoot } = {}) {
  const manifest = JSON.parse(await readFile(resolve(root, 'versions.json'), 'utf8'));
  const locales = await readLocales(root);
  const navigation = JSON.parse(await readFile(resolve(root, 'navigation.json'), 'utf8'));
  if (
    !manifest.versions.some(
      /** Check whether an entry matches `version.id === manifest.stable && version.status === 'stable'`. */ (
        version,
      ) => version.id === manifest.stable && version.status === 'stable',
    )
  ) {
    throw new Error('Invalid stable version');
  }
  if (
    manifest.versions.filter(
      /** Keep entries matching `version.status === 'stable'`. */ (version) => version.status === 'stable',
    ).length !== 1
  ) {
    throw new Error('Expected one stable version');
  }
  const errors = [];
  const entries = navigation.entries;
  const groups = navigation.groups || [];
  if (new Set(groups.map(/** Map each entry to `group.id`. */ (group) => group.id)).size !== groups.length) {
    errors.push('Navigation groups must have unique IDs');
  }
  for (const group of groups) {
    if (
      !/^[a-zA-Z][a-zA-Z0-9]*$/.test(group.id) ||
      !['overview', 'operations', 'administration'].includes(group.section) ||
      typeof group.title !== 'string' ||
      !group.title ||
      !/^i-lucide-[a-z0-9-]+$/.test(group.icon) ||
      !(
        group.slug === null ||
        entries.some(
          /** Check whether an entry matches `entry.tab === 'guides' && entry.slug === group.slug && entry.group === group.id && entry.section === group.section`. */ (
            entry,
          ) =>
            entry.tab === 'guides' &&
            entry.slug === group.slug &&
            entry.group === group.id &&
            entry.section === group.section,
        )
      )
    )
      errors.push(`${group.id}: invalid navigation group`);
  }
  if (
    new Set(entries.map(/** Map each entry to `entry.slug`. */ (entry) => entry.slug)).size !== entries.length ||
    new Set(entries.map(/** Map each entry to `entry.order`. */ (entry) => entry.order)).size !== entries.length
  ) {
    errors.push('Navigation entries must have unique slugs and order');
  }
  for (const entry of entries) {
    if (
      !['get-started', 'guides', 'api'].includes(entry.tab) ||
      !(
        entry.tab === 'guides'
          ? ['overview', 'operations', 'administration']
          : entry.tab === 'api'
            ? ['api']
            : ['getting-started']
      ).includes(entry.section) ||
      !Number.isInteger(entry.order) ||
      (entry.tab === 'guides'
        ? !groups.some(
            /** Check whether an entry matches `group.id === entry.group && group.section === entry.section`. */ (
              group,
            ) => group.id === entry.group && group.section === entry.section,
          )
        : entry.group !== null)
    ) {
      errors.push(`${entry.slug}: invalid navigation metadata`);
    }
  }
  const texts = new Map();
  /** Execute the load operation. */
  const load = async (locale, version, slug) => {
    const key = `${locale}/${version}/${slug}`;
    if (!texts.has(key)) {
      texts.set(key, await readFile(resolve(root, locale, 'docs', version, slug + '.md'), 'utf8'));
    }
    return texts.get(key);
  };
  for (const version of manifest.versions) {
    if (version.status !== 'preview') await verifyOpenApiArchive(root, version);
    if (!/^[a-f0-9]{40}$/.test(version.revision) || !/^(v\d+\.\d+|next)$/.test(version.id)) {
      throw new Error('Invalid version provenance');
    }
    if (new Set(version.slugs).size !== version.slugs.length) errors.push(`${version.id}: duplicate slugs`);
    for (const slug of version.slugs) {
      if (
        !/^[a-z0-9-]+$/.test(slug) ||
        entries.filter(/** Keep entries matching `entry.slug === slug`. */ (entry) => entry.slug === slug).length !== 1
      ) {
        errors.push(`${version.id}/${slug}: missing or invalid navigation entry`);
      }
    }
    for (const [alias, redirect] of Object.entries(navigation.redirects)) {
      if (
        version.slugs.includes(alias) ||
        !version.slugs.includes(redirect.to) ||
        Object.values(redirect.anchors).some(
          /** Check whether an entry matches `!version.slugs.includes(slug)`. */ (slug) =>
            !version.slugs.includes(slug),
        )
      ) {
        errors.push(`${version.id}/${alias}: invalid redirect`);
      }
    }
    for (const locale of Object.keys(locales)) {
      const directory = resolve(root, locale, 'docs', version.id);
      const files = (await readdir(directory))
        .filter(/** Keep entries matching `name.endsWith('.md')`. */ (name) => name.endsWith('.md'))
        .sort();
      if (
        JSON.stringify(files) !==
        JSON.stringify(version.slugs.map(/** Map each entry to `slug + '.md'`. */ (slug) => slug + '.md').sort())
      ) {
        errors.push(`${locale}/${version.id}: page coverage`);
      }
      for (const slug of version.slugs) {
        const text = await load(locale, version.id, slug);
        const key = `${locale}/${version.id}/${slug}`;
        const frontmatter = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] || '';
        if (
          !['title', 'description'].every(
            /** Require every entry to match `new RegExp(`^${field}:[ \t]*(?:[^\\s\\n][^\\n]*|\\n[ \t]+\\S[^\\n]*)`, 'm').test(frontmatter)`. */ (
              field,
            ) => new RegExp(`^${field}:[ \t]*(?:[^\\s\\n][^\\n]*|\\n[ \t]+\\S[^\\n]*)`, 'm').test(frontmatter),
          )
        ) {
          errors.push(`${key}: frontmatter`);
        }
        if (/\b(?:TODO|TBD)\b|ZXQ\w*QXZ/.test(text)) errors.push(`${key}: unfinished content`);
        const anchors = [...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map(
          /** Map each entry to `match[1]`. */ (match) => match[1],
        );
        if (new Set(anchors).size !== anchors.length) errors.push(`${key}: duplicate anchors`);
        if (locale !== 'en') {
          const english = await load('en', version.id, slug);
          /** Compute `technical` as `(value.match(/```[\s\S]*?```|`[^`\n]+`/g) || []).sort()`. */
          const technical = (value) => (value.match(/```[\s\S]*?```|`[^`\n]+`/g) || []).sort();
          if (JSON.stringify(technical(text)) !== JSON.stringify(technical(english))) {
            errors.push(`${key}: translated technical identifiers or examples`);
          }
          if (text === english) errors.push(`${key}: untranslated English page`);
          /** Compute `description` as `/^---\n[\s\S]*?description:([\s\S]*?)\n---/ .exec(value)?.[1] .trim() .replace(/^['"]|['"]$/g, '') .replace(/\s+/g, ' ')`. */
          const description = (value) =>
            /^---\n[\s\S]*?description:([\s\S]*?)\n---/
              .exec(value)?.[1]
              .trim()
              .replace(/^['"]|['"]$/g, '')
              .replace(/\s+/g, ' ');
          if (description(text) === description(english)) errors.push(`${key}: untranslated English description`);
          /** Compute `prose` as `value .replace(/^---\n[\s\S]*?\n---/, '') .replace(/```[\s\S]*?```/g, '') .split('\n\n') .map((part) => part.trim().replace(/\s+/g, ' ')) .f`. */
          const prose = (value) =>
            value
              .replace(/^---\n[\s\S]*?\n---/, '')
              .replace(/```[\s\S]*?```/g, '')
              .split('\n\n')
              .map(
                /** Map each entry to `part.trim().replace(/\s+/g, ' ')`. */ (part) => part.trim().replace(/\s+/g, ' '),
              )
              .filter(
                /** Keep entries matching `part.length > 80 && !part.startsWith('<')`. */ (part) =>
                  part.length > 80 && !part.startsWith('<'),
              );
          const englishProse = new Set(prose(english));
          if (
            prose(text).some(
              /** Check whether an entry matches `englishProse.has(part)`. */ (part) => englishProse.has(part),
            )
          )
            errors.push(`${key}: untranslated English paragraph`);

          const originalAnchors = [...english.matchAll(/<a id="([^"]+)"><\/a>/g)].map(
            /** Map each entry to `match[1]`. */ (match) => match[1],
          );
          if (JSON.stringify(anchors) !== JSON.stringify(originalAnchors)) errors.push(`${key}: anchor coverage`);
        }
        if (/\]\s+\(/.test(text)) errors.push(`${key}: malformed Markdown link`);
        for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
          const [url, anchor] = match[1].split('#');
          if (/^(?:https?:|mailto:)/.test(url)) continue;
          if (url.startsWith('/images/')) {
            if (assetRoot) {
              try {
                const image =
                  version.id === 'next' && previewAssetRoot && url.startsWith('/images/docs/next/')
                    ? resolve(previewAssetRoot, url.slice('/images/docs/next/'.length))
                    : resolve(assetRoot, url.slice(1));
                await access(image);
              } catch {
                errors.push(`${key}: image ${url}`);
              }
            }
            continue;
          }
          const segments = url.split('/');
          if (Object.hasOwn(locales, segments[1])) segments.splice(1, 1);
          const path = segments.join('/');
          const targetMatch = /^\/docs\/([^/]+)\/([^/]+)$/.exec(path);
          const target =
            targetMatch &&
            manifest.versions.find(
              /** Find the entry matching `entry.id === targetMatch[1]`. */ (entry) => entry.id === targetMatch[1],
            );
          if (!url && anchor) {
            if (!anchors.includes(anchor)) errors.push(`${key}: missing anchor ${anchor}`);
          } else if (!target || !target.slugs.includes(targetMatch[2])) {
            errors.push(`${key}: unresolved link ${match[1]}`);
          } else if (anchor) {
            const targetText = await load(locale, target.id, targetMatch[2]);
            if (!targetText.includes(`<a id="${anchor}"></a>`)) errors.push(`${key}: missing anchor ${match[1]}`);
          }
          if (version.status !== 'preview' && target?.status === 'preview') {
            errors.push(`${key}: released page links to preview`);
          }
        }
      }
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return manifest;
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const root = process.argv[2] || '.';
  const manifest = await checkDocs(root);
  console.log(
    `Validated ${manifest.versions.length} documentation versions in ${Object.keys(await readLocales(root)).length} languages.`,
  );
}
