import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineNuxtModule } from 'nuxt/kit';
import { verifyOpenApiArchive } from '../content/scripts/openapi.mjs';

/** Bundle only verified, released schemas as local public assets; never expose next sources. */
export default defineNuxtModule({
  meta: { name: 'repovio-openapi' },
  /** Define setup behavior. */
  async setup(_options, nuxt) {
    const root = nuxt.options.rootDir;
    const content = resolve(root, 'content');
    const manifest = JSON.parse(await readFile(resolve(content, 'versions.json'), 'utf8'));
    const assets = resolve(root, '.cache/openapi-public');
    await rm(assets, { recursive: true, force: true });
    await mkdir(assets, { recursive: true });
    for (const version of manifest.versions.filter(
      /** Keep entries matching `entry.status !== 'preview'`. */ (entry: { status: string }) =>
        entry.status !== 'preview',
    )) {
      await verifyOpenApiArchive(content, version);
      if (version.openapi) {
        await writeFile(resolve(assets, `${version.id}.json`), await readFile(resolve(content, version.openapi.file)));
      }
    }
    nuxt.hook(
      'nitro:config',
      /** Handle each nuxt.hook callback invocation. */ (config) => {
        config.publicAssets ||= [];
        config.publicAssets.push({ dir: assets, baseURL: '/openapi', maxAge: 0 });
      },
    );
  },
});
