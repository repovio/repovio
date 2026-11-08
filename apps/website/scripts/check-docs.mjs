import { checkDocs } from '../content/scripts/validate.mjs';
export { checkDocs };
await checkDocs('content', { assetRoot: 'public', previewAssetRoot: 'captures/next' });
console.log('Repovio documentation verified.');
