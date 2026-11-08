import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Validate the locally generated OpenAPI subset, including every internal JSON pointer. */
export function validateOpenApi(document) {
  if (
    !document ||
    !/^3\.(0|1)\./.test(document.openapi || '') ||
    !document.info?.title ||
    !document.info?.version ||
    !document.paths ||
    typeof document.paths !== 'object' ||
    Array.isArray(document.paths) ||
    !Object.keys(document.paths).length
  )
    throw new Error('Invalid OpenAPI document');
  for (const path of Object.keys(document.paths)) if (!path.startsWith('/')) throw new Error('Invalid OpenAPI path');
  /** Execute the visit operation. */
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if ('$ref' in value) {
      if (typeof value.$ref !== 'string' || !value.$ref.startsWith('#/'))
        throw new Error('Only local OpenAPI references are supported');
      let target = document;
      for (const part of value.$ref.slice(2).split('/')) {
        const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
        if (!target || typeof target !== 'object' || !Object.hasOwn(target, key))
          throw new Error(`Unresolved OpenAPI reference: ${value.$ref}`);
        target = target[key];
      }
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(document);
  return document;
}

/** Check released schema bytes against their exact application revision and digest. */
export function verifyOpenApiBytes(version, bytes) {
  const required = version.slugs?.includes('api-reference');
  if (!required && !version.openapi) return;
  const metadata = version.openapi;
  if (
    !metadata ||
    metadata.file !== `openapi/${version.id}.json` ||
    metadata.revision !== version.revision ||
    !/^[a-f0-9]{64}$/.test(metadata.sha256 || '')
  )
    throw new Error(`Invalid OpenAPI provenance: ${version.id}`);
  if (createHash('sha256').update(bytes).digest('hex') !== metadata.sha256)
    throw new Error(`OpenAPI checksum mismatch: ${version.id}`);
  validateOpenApi(JSON.parse(bytes.toString('utf8')));
}

/** Check a released API archive against its exact application revision and byte digest. */
export async function verifyOpenApiArchive(root, version) {
  if (!version.slugs?.includes('api-reference') && !version.openapi) return;
  if (!version.openapi || version.openapi.file !== `openapi/${version.id}.json`)
    throw new Error(`Invalid OpenAPI provenance: ${version.id}`);
  verifyOpenApiBytes(version, await readFile(resolve(root, version.openapi.file)));
}
