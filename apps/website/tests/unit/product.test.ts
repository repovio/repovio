import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import manifest from '../../content/versions.json' with { type: 'json' };
import { productCaptureTargets } from '../../scripts/product-capture-fixtures.mjs';
import { supportedLocales } from '../../shared/locales';
import { getProductFeature, isProductSectionActive, productFeatures, productPaths } from '../../shared/product';

describe('published product content', /** Verify published product content. */ () => {
  it('keeps the documentation section active on localized handbook details without matching other sections', /** Verify keeps the documentation section active on localized handbook details without matching other sections. */ () => {
    for (const prefix of ['', '/de', '/ar']) {
      expect(
        isProductSectionActive(`${prefix}/docs/v1.0/installation`, `${prefix}/docs/v1.0/overview`, `${prefix}/docs`),
      ).toBe(true);
      expect(isProductSectionActive(`${prefix}/integrations`, `${prefix}/integrations`, `${prefix}/docs`)).toBe(true);
      expect(isProductSectionActive(`${prefix}/self-hosting`, `${prefix}/integrations`, `${prefix}/docs`)).toBe(false);
      expect(isProductSectionActive(`${prefix}/docs-other`, `${prefix}/docs/v1.0/overview`, `${prefix}/docs`)).toBe(
        false,
      );
    }
  });
  it('resolves only the seven declared capabilities and links to published handbook pages', /** Verify resolves only the seven declared capabilities and links to published handbook pages. */ () => {
    const stable = manifest.versions.find(
      /** Find the entry matching `id === manifest.stable`. */ ({ id }) => id === manifest.stable,
    )!;
    expect(productFeatures).toHaveLength(7);
    expect(new Set(productPaths).size).toBe(10);
    for (const feature of productFeatures) {
      expect(getProductFeature(feature.slug)).toBe(feature);
      for (const slug of feature.docs) expect(stable.slugs).toContain(slug);
    }
    for (const slug of ['constructor', '__proto__', 'unknown', 'dashboard/extra', '']) {
      expect(getProductFeature(slug)).toBeUndefined();
    }
  });

  it('has complete product content in every locale without English fallback', /** Verify has complete product content in every locale without English fallback. */ async () => {
    const reference = JSON.parse(await readFile('i18n/locales/en.json', 'utf8'));
    const keys = Object.keys(reference).filter(
      /** Keep entries matching `key.startsWith('product_')`. */ (key) => key.startsWith('product_'),
    );
    for (const { code } of supportedLocales) {
      const messages = JSON.parse(await readFile(`i18n/locales/${code}.json`, 'utf8'));
      expect(
        Object.keys(messages)
          .filter(/** Keep entries matching `key.startsWith('product_')`. */ (key) => key.startsWith('product_'))
          .sort(),
        code,
      ).toEqual(keys.sort());
      for (const feature of productFeatures) {
        for (const key of [
          feature.titleKey,
          feature.descriptionKey,
          `product_details_${feature.slug}_useCase`,
          `product_details_${feature.slug}_limit`,
        ]) {
          expect(messages[key], `${code}: ${key}`).toEqual(expect.any(String));
          expect(messages[key].trim().length).toBeGreaterThan(0);
        }
      }
      if (code !== 'en') expect(messages.product_details_mcp_limit).not.toBe(reference.product_details_mcp_limit);
    }
  });

  it('provides actual released captures for every screen with matching provenance and bytes', /** Verify provides actual released captures for every screen with matching provenance and bytes. */ async () => {
    const provenance = JSON.parse(await readFile('public/images/product/capture.json', 'utf8'));
    expect(provenance.revision).toBe(
      manifest.versions.find(
        /** Find the entry matching `id === manifest.stable`. */ ({ id }) => id === manifest.stable,
      )!.revision,
    );
    expect(provenance.workingTreeDirty).toBe(false);
    expect(provenance.syntheticData).toBe(true);
    for (const feature of productFeatures) {
      if (!feature.screenshot) continue;
      expect(
        productCaptureTargets.some(
          /** Check whether an entry matches `name === feature.screenshot`. */ ({ name }) =>
            name === feature.screenshot,
        ),
      ).toBe(true);
      for (const locale of ['en', 'de']) {
        for (const mode of ['light', 'dark']) {
          const name = `${feature.screenshot}-${locale}-${mode}.png`;
          const hash = createHash('sha256')
            .update(await readFile(`public/images/product/${name}`))
            .digest('hex');
          expect(
            provenance.files.find(
              /** Find the entry matching `file.name === name`. */ (file: { name: string }) => file.name === name,
            )?.sha256,
            name,
          ).toBe(hash);
        }
      }
    }
  });
});
