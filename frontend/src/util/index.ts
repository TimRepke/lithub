import type { RouteLocationNormalized, RouteRecordNormalized } from "vue-router";

// inspired by https://github.com/jashkenas/underscore/blob/master/modules/_shallowProperty.js
// Internal helper to generate a function to obtain property `key` from `obj`.
export function shallowProperty<T>(key: string) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (obj: unknown): T | undefined => (obj == null ? undefined : obj[key]);
}

// inspired by https://github.com/jashkenas/underscore/blob/a15d1afc708ec23894880b2ec4c1eb309447a906/modules/_setup.js
// inspired by https://github.com/jashkenas/underscore/blob/a15d1afc708ec23894880b2ec4c1eb309447a906/modules/_tagTester.js
// Internal function for creating a `toString`-based type tester.
export const tagTester = (name: string) => (obj: unknown) => Object.prototype.toString.call(obj) === `[object ${name}]`;

// Internal function to check whether `key` is an own property name of `obj`.
export const has = (obj: object, key: string) => obj != null && Object.prototype.hasOwnProperty.call(obj, key);

// Is a given variable an object?
export const isObject = (obj: unknown) => {
  if (!obj) return false;
  const type = typeof obj;
  return type === "function" || (type === "object" && !!obj);
};

// inspired by https://github.com/jashkenas/underscore/blob/master/modules/keys.js
// Retrieve the names of an object's own properties.
// Delegates to **ECMAScript 5**'s native `Object.keys`.
export const nativeKeys = Object.keys;
export const keys = (obj: unknown) => {
  if (!isObject(obj)) return [];
  if (nativeKeys) return nativeKeys(obj as object);
  const objKeys = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj as object) if (has(obj as object, key)) objKeys.push(key);
  return objKeys;
};

// inspired by https://github.com/jashkenas/underscore/blob/master/modules/_getLength.js
// Internal helper to obtain the `length` property of an object.
export const getLength = shallowProperty<number>("length");
// inspired by https://github.com/jashkenas/underscore/blob/master/modules/isString.js
export const isString = tagTester("String");
// inspired by https://github.com/jashkenas/underscore/blob/master/modules/isArguments.js
export const isArguments = tagTester("Arguments");

// inspired by https://github.com/jashkenas/underscore/blob/master/modules/isArray.js
// inspired by https://github.com/jashkenas/underscore/blob/master/modules/_setup.js
// Is a given value an array?
// Delegates to ECMA5's native `Array.isArray`.
export const nativeIsArray = Array.isArray;
export const isArray = <T>(obj: unknown): obj is Array<T> => nativeIsArray(obj) || tagTester("Array")(obj);

// From https://github.com/jashkenas/underscore/blob/master/modules/isEmpty.js
export const isEmpty = (obj: unknown | null | undefined) => {
  if (obj === null || obj === undefined) return true;
  const length = getLength(obj);
  if (typeof length === "number" && (isArray(obj) || isString(obj) || isArguments(obj))) return length === 0;
  return getLength(keys(obj)) === 0;
};

// get a list/generator of numbers from `start` to `end` (inclusive)
export function* range(start: number, end: number) {
  for (let i = start; i <= end; i += 1) {
    yield i;
  }
}

export function isOnRoute(loc: RouteLocationNormalized, name: string): boolean {
  return loc.matched.findIndex((match: RouteRecordNormalized) => match.name === name) >= 0;
}

export function is<T>(obj: T | null | undefined): obj is T {
  return obj !== null && obj !== undefined;
}

export function isNone(obj: unknown | null | undefined): obj is null | undefined {
  return obj === null || obj === undefined;
}

export function notNone(obj: unknown | null | undefined): obj is unknown {
  return obj !== undefined && obj !== null;
}

export function padZero(num: number, padding: number): string {
  return num.toString(10).padStart(padding, "0");
}

export function dt2str(datetime: string | null | undefined): string | null {
  if (datetime !== null && datetime !== undefined) {
    const dt = new Date(datetime);
    return `
    ${dt.getFullYear()}-${padZero(dt.getMonth() + 1, 2)}-${padZero(dt.getDate(), 2)} 
    ${padZero(dt.getHours(), 2)}:${padZero(dt.getMinutes(), 2)}`;
  }
  return null;
}

// https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function useDelay<T extends Array<any>, U>(fn: (...args: T) => U, delay: number) {
  let _delay: number | null = null;

  function clear() {
    if (_delay) clearTimeout(_delay);
    _delay = null;
  }

  function call(...args: T): U {
    clear();
    return fn(...args);
  }

  function delayedCall(...args: T): Promise<U> {
    clear();
    return new Promise((resolve) => {
      // @ts-ignore
      _delay = setTimeout(() => {
        resolve(call(...args));
      }, delay);
    });
  }

  return { call, delayedCall, clear };
}
