import { is, isNone, None } from "@/util";

export class Bitmask {
  public readonly length: number;
  private readonly _mask: Uint32Array;

  constructor(length: number, bits?: Uint32Array) {
    this.length = length;
    this._mask = bits || new Uint32Array((length >>> 5) + 1);
  }

  get(i: number): boolean {
    i |= 0;
    return !!(this._mask[i >>> 5] & (1 << (i & 31)));
  }

  get mask() {
    return this._mask;
  }

  get inverse() {
    const mask = new Bitmask(this.length, new Uint32Array(this._mask));
    mask.invert();
    return mask;
  }

  reset() {
    for (let i = 0; i < this._mask.length; i++) {
      this._mask[i] &= 0;
    }
  }

  invert() {
    for (let i = 0; i < this._mask.length; i++) {
      this._mask[i] = ~this._mask[i];
    }
  }

  set(i: number, v: boolean = true) {
    i |= 0;
    const idx = i >>> 5;
    const bit = 1 << (i & 31);
    if (v) {
      this._mask[idx] |= bit;
    } else {
      this._mask[idx] &= ~bit;
    }
    return this;
  }

  ids(): number[] {
    /**
     * Returns a list of integer IDs where the bit is set
     */
    return [...Array(this.length).keys()] //
      .map((i) => (this.get(i) ? i : null)) //
      .filter((e): e is number => e !== null);
  }

  or(other: Bitmask | None) {
    /**
     * Merge another bitmask with bitwise OR into this bitmask
     */
    if (other) {
      for (let i = 0; i < this._mask.length; i++) {
        this._mask[i] = this._mask[i] | other.mask[i];
      }
    }
  }

  and(other: Bitmask | None) {
    /**
     * Merge another bitmask with bitwise AND into this bitmask
     */
    if (other) {
      for (let i = 0; i < this._mask.length; i++) {
        this._mask[i] = this._mask[i] & other.mask[i];
      }
    }
  }

  isSame(other: Bitmask | None): boolean | null {
    if (!other) return null;
    for (let i = 0; i < this._mask.length; i++) {
      if (this._mask[i] ^ other.mask[i]) return false;
    }
    return true;
  }

  get count(): number {
    /**
     * Returns the number of bits set to 1 in the mask.
     *
     * The code below is very fancy. Essentially equivalent to this (but much faster)
     * for(let chunk of this._mask{
     *  while (chunk) {
     *    count += chunk & 1;
     *    chunk >>= 1;
     *  }
     * }
     */
    const copy = new Uint32Array(this._mask);
    let ret = 0;
    for (let i = 0; i < copy.length; i++) {
      copy[i] = copy[i] - ((copy[i] >> 1) & 0x55555555);
      copy[i] = (copy[i] & 0x33333333) + ((copy[i] >> 2) & 0x33333333);
      ret += (((copy[i] + (copy[i] >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
    }
    return ret;
  }

  *[Symbol.iterator]() {
    /**
     * Iterates over all bits in the mask.
     */
    for (let i = 0; i < this.length; i++) {
      yield this.get(i);
    }
  }

  static fromBase64(s: string) {
    /**
     * Given a base64 string, get a new bitmask
     */
    const data = atob(s);
    const buffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      buffer[i] = data.charCodeAt(i);
    }
    const mask = new Uint32Array(buffer.buffer);
    return new Bitmask(mask.length * 32, mask);
  }

  toBase64(): string {
    const bytes = new Uint8Array(this._mask.buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export function or(...sets: (Bitmask | None)[]) {
  const filtered = sets.filter((m): m is Bitmask => is<Bitmask>(m));
  if (filtered.length == 0) {
    return null;
  }
  if (filtered.length == 1) {
    return filtered[0];
  }
  const out = new Bitmask(filtered[0].length, new Uint32Array(filtered[0].mask)); // copy of first set
  for (let i = 1; i < sets.length; i++) {
    out.or(filtered[i]);
  }
  return out;
}

export function and(...sets: (Bitmask | None)[]) {
  const filtered = sets.filter((m): m is Bitmask => is<Bitmask>(m));
  if (filtered.length == 0) {
    return null;
  }
  if (filtered.length == 1) {
    return filtered[0];
  }

  const out = new Bitmask(filtered[0].length, new Uint32Array(filtered[0].mask)); // copy of first set
  for (let i = 1; i < filtered.length; i++) {
    out.and(filtered[i]);
  }
  return out;
}

export function isNew(oldMask: Bitmask | None, newMask: Bitmask | None): boolean {
  if (isNone(oldMask) && isNone(newMask)) return false;
  if (is<Bitmask>(oldMask) && is<Bitmask>(newMask)) return !!newMask.isSame(newMask);
  return true;
}
