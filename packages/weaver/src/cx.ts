/**
 * @module
 *
 * Knyt Weaver forks the `classnames` package with the following changes:
 *
 * - Adds support for `number` values so that `classNames(1)` returns `"1"`
 *     - This allows for the attribute values from the `@knyt/html-type` package to be used directly
 * - Exports the function as `cx` instead of `classnames`
 *     - `cx` is easier to read and type than `classnames` (IMO 😐)
 *     - The `cx` name was inspired by Emotion: https://emotion.sh/docs/@emotion/css#cx
 */

export { classNames as cx };

// ---

/**
 * @module classnames
 *
 * classnames
 * https://github.com/JedWatson/classnames
 *
 * @license
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 Jed Watson
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
 */

const hasOwn = {}.hasOwnProperty;

/**
 * classnames type definitions
 * https://github.com/JedWatson/classnames/blob/main/index.d.ts
 *
 * @license
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018
 *
 * Dave Keen <http://www.keendevelopment.ch>
 * Adi Dahiya <https://github.com/adidahiya>
 * Jason Killian <https://github.com/JKillian>
 * Sean Kelley <https://github.com/seansfkelley>
 * Michal Adamczyk <https://github.com/mradamczyk>
 * Marvin Hagemeister <https://github.com/marvinhagemeister>
 */

export type Value = string | number | boolean | undefined | null;
export type Mapping = Record<string, any>;
export interface ArgumentArray extends Array<Argument> {}
export interface ReadonlyArgumentArray extends ReadonlyArray<Argument> {}
export type Argument = Value | Mapping | ArgumentArray | ReadonlyArgumentArray;

/**
 * A simple JavaScript utility for conditionally joining classNames together.
 */
function classNames(...args: ArgumentArray): string {
  let classes = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg) {
      classes = appendClass(classes, parseValue(arg));
    }
  }

  return classes;
}

function parseValue(arg: NonNullable<Argument>) {
  if (typeof arg === "number") {
    return String(arg);
  }

  if (typeof arg === "string") {
    return arg;
  }

  if (typeof arg !== "object") {
    return "";
  }

  if (Array.isArray(arg)) {
    return classNames(...arg);
  }

  if (
    arg.toString !== Object.prototype.toString &&
    !arg.toString.toString().includes("[native code]")
  ) {
    return arg.toString();
  }

  let classes = "";

  if (Array.isArray(arg)) {
    const arr = arg as ArgumentArray;

    for (const item of arr) {
      if (item) {
        classes = appendClass(classes, parseValue(item));
      }
    }
  } else {
    const mapping = arg as Mapping;

    for (const key in arg) {
      if (hasOwn.call(arg, key) && mapping[key]) {
        classes = appendClass(classes, key);
      }
    }
  }

  return classes;
}

function appendClass(value: string, newClass: string) {
  if (!newClass) {
    return value;
  }

  return value ? value + " " + newClass : newClass;
}
