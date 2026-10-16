import fs from 'node:fs';
import zlib from 'node:zlib';

function createPNG(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = createChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx1 = width * 0.35;
  const cy1 = height * 0.35;
  const r1 = width * 0.22;

  const cx2 = width * 0.68;
  const cy2 = height * 0.68;
  const r2 = width * 0.25;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      const d1 = Math.hypot(x - cx1, y - cy1);
      const d2 = Math.hypot(x - cx2, y - cy2);

      let r = 10, g = 15, b = 29, a = 255;

      if (d1 < r1) {
        const factor = d1 / r1;
        r = Math.round(254 * (1 - factor * 0.2));
        g = Math.round(200 * (1 - factor * 0.5));
        b = Math.round(40 * (1 - factor * 0.5));
      } else if (d1 < r1 * 1.5) {
        const glow = 1 - (d1 - r1) / (r1 * 0.5);
        r = Math.min(255, r + Math.round(245 * glow * 0.6));
        g = Math.min(255, g + Math.round(158 * glow * 0.4));
        b = Math.min(255, b + Math.round(11 * glow * 0.2));
      }

      if (d2 < r2) {
        const factor = d2 / r2;
        r = Math.round(30 + factor * 20);
        g = Math.round(120 + (1 - factor) * 80);
        b = Math.round(220 + (1 - factor) * 35);
      } else if (d2 < r2 * 1.25) {
        const glow = 1 - (d2 - r2) / (r2 * 0.25);
        r = Math.min(255, r + Math.round(56 * glow * 0.5));
        g = Math.min(255, g + Math.round(189 * glow * 0.5));
        b = Math.min(255, b + Math.round(248 * glow * 0.8));
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

fs.mkdirSync('./public/icons', { recursive: true });
fs.writeFileSync('./public/icons/icon-192.png', createPNG(192, 192));
fs.writeFileSync('./public/icons/icon-512.png', createPNG(512, 512));
console.log('Successfully generated icon-192.png and icon-512.png');
