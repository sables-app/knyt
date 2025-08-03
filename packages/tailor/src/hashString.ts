/* eslint-disable */

/**
 * A hash of a string using a MurmurHash algorithm
 *
 * Inspired by https://github.com/garycourt/murmurhash-js
 * Ported from https://github.com/aappleby/smhasher/blob/61a0530f28277f2e850bfc39600ce61d02b518de/src/MurmurHash2.cpp#L37-L86
 * Copied from https://github.com/emotion-js/emotion/blob/main/packages/hash/src/index.ts
 *
 * @license
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2011 Gary Court
 * Copyright (c) 2016 Austin Appleby
 * Copyright (c) Emotion team and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @internal scope: workspace
 */
export function hashString(str: string): string {
  // 'm' and 'r' are mixing constants generated offline.
  // They're not really 'magic', they just happen to work well.

  // const m = 0x5bd1e995;
  // const r = 24;

  // Initialize the hash

  var h = 0;

  // Mix 4 bytes at a time into the hash

  var k,
    i = 0,
    len = str.length;
  for (; len >= 4; ++i, len -= 4) {
    k =
      (str.charCodeAt(i) & 0xff) |
      ((str.charCodeAt(++i) & 0xff) << 8) |
      ((str.charCodeAt(++i) & 0xff) << 16) |
      ((str.charCodeAt(++i) & 0xff) << 24);

    k =
      /* Math.imul(k, m): */
      (k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0xe995) << 16);
    k ^= /* k >>> r: */ k >>> 24;

    h =
      /* Math.imul(k, m): */
      ((k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0xe995) << 16)) ^
      /* Math.imul(h, m): */
      ((h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16));
  }

  // Handle the last few bytes of the input array

  switch (len) {
    // @ts-ignore
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
    // @ts-ignore
    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
    case 1:
      h ^= str.charCodeAt(i) & 0xff;
      h =
        /* Math.imul(h, m): */
        (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16);
  }

  // Do a few final mixes of the hash to ensure the last few
  // bytes are well-incorporated.

  h ^= h >>> 13;
  h =
    /* Math.imul(h, m): */
    (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16);

  return ((h ^ (h >>> 15)) >>> 0).toString(36);
}
