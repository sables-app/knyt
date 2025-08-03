/**
 * A utility function to enforce that a value is of the expected type.
 * This function is a no-op at runtime but provides strict type checking in TypeScript.
 *
 * @remarks
 *
 * This utility uses a two-stage function design for enhanced strictness. It ensures
 * that the types are exactly the same, rather than merely assignable. This is particularly
 * useful for scenarios where precise type matching is required.
 *
 * @example
 *
 * ```ts
 * // TypeScript error: HTMLDivElement is not exactly the same as Element
 * typeCheck<HTMLDivElement>(typeCheck.identify<Element>());
 * ```
 */
export function typeCheck<T>(checker: Checker<T>): T {
  return checker.value;
}

export namespace typeCheck {
  export function identify<T>(_value?: T): Checker<T> {
    return new Checker({} as T);
  }
}

class Checker<in out T> {
  constructor(public value: T) {}
}
