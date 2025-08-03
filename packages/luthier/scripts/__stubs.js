/**
 * A stub for the HTMLElement class.
 *
 * @remarks
 *
 * This class is used to provide a fallback for the HTMLElement class
 * when it is not available in the global scope.
 *
 * This allows the `@knyt/luthier` package to be imported in environments
 * where the HTMLElement class is not available, without immediately
 * throwing an error.
 *
 * Instead, an error will be thrown when an element is instantiated.
 *
 * @internal scope: package
 */
class HTMLElementStub {
  constructor() {
    throw new Error("HTMLElement is not defined.");
  }
}

/**
 * @global HTMLElement
 */

/**
 * An implementation of the HTMLElement class.
 *
 * @internal scope: package
 */
export function __HTMLElement() {
  return (
    // Attempt to access the HTMLElement class from the `globalThis` object.
    // This supports environments where the `HTMLElement` class is polyfilled.
    // eslint-disable-next-line no-undef
    globalThis.HTMLElement ??
    // Next, attempt to access the HTMLElement class from the global scope.
    // eslint-disable-next-line no-undef
    (typeof HTMLElement === "function" ? HTMLElement : undefined) ??
    // Finally, use a stub class if the HTMLElement class is not available.
    // This allows the package to be imported in environments where the
    // HTMLElement class is not available.
    // This allows the package to be used if elements are not needed.
    HTMLElementStub
  );
}
