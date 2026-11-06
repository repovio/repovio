import { inflateSync } from 'node:zlib';

/** Validate PNG framing, chunk checksums, dimensions and compressed image data at startup. */
export function validateBrandingPng(body: Buffer, size: number): void {
  /** Reject malformed, corrupt, or incorrectly sized PNG data. */
  const fail = (): never => {
    throw new Error(`Expected a valid ${size}x${size} PNG`);
  };
  if (!body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) fail();
  let offset = 8;
  let ended = false;
  const data: Buffer[] = [];
  while (offset + 12 <= body.length) {
    const length = body.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > body.length) fail();
    const type = body.toString('ascii', offset + 4, offset + 8);
    const chunk = body.subarray(offset + 4, end - 4);
    let crc = 0xffffffff;
    for (const byte of chunk) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    if ((crc ^ 0xffffffff) >>> 0 !== body.readUInt32BE(end - 4)) fail();
    if (offset === 8) {
      if (type !== 'IHDR' || length !== 13) fail();
      if (body.readUInt32BE(offset + 8) !== size || body.readUInt32BE(offset + 12) !== size) fail();
    } else if (type === 'IHDR') fail();
    if (type === 'IDAT') data.push(body.subarray(offset + 8, end - 4));
    offset = end;
    if (type === 'IEND') {
      if (length !== 0 || offset !== body.length) fail();
      ended = true;
      break;
    }
  }
  if (!ended || !data.length) fail();
  if (!inflateSync(Buffer.concat(data), { maxOutputLength: size * size * 8 + size * 8 }).length) fail();
}
