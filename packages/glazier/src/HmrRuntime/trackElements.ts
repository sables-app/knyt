import type { HTMLElementConstructor } from "@knyt/luthier";

const elementsByConstructor = new WeakMap<
  HTMLElementConstructor,
  Set<WeakRef<HTMLElement>>
>();

/**
 * Modify the given constructor to track elements.
 *
 * @remarks
 *
 * This function extends the provided constructor to track all instances
 * created from it. It does so by creating a subclass that adds each new
 * instance to a `Set` of `WeakRef`s, allowing for efficient tracking
 * without preventing garbage collection.
 *
 * The trade-off is that the returned constructor is a new class,
 * so while identity check like `instanceof` and and comparing tag names
 * will still work, direct constructor equality checks will not.
 * However, the vast majority of use cases should not be affected by this change.
 *
 * I'd argue that it is bad practice to rely on constructor equality checks
 * for custom elements in the first place, as it can lead to brittle code,
 * and HMR will inevitably break such checks anyway.
 *
 * @param originalConstructor - The original constructor to be tracked.
 * @returns A new constructor that tracks its instances.
 *
 * @internal scope: package
 */
export function trackElements<T extends HTMLElementConstructor>(
  originalConstructor: T,
): T {
  const elements = new Set<WeakRef<HTMLElement>>();

  // @ts-expect-error - TS is asking for the following:
  // > A mixin class must have a constructor with a single rest parameter of type any[]
  // However, this is not possible, because `HTMLElement`s constructors do not take any parameters.
  // We can safely ignore this error, as we are not using any parameters in the constructor.
  class trackedConstructor extends originalConstructor {
    constructor() {
      super();

      elements.add(new WeakRef(this));

      if (!elementsByConstructor.has(trackedConstructor)) {
        elementsByConstructor.set(trackedConstructor, elements);
      }
    }
  }

  // Copy static properties and methods from the original constructor
  Object.assign(trackedConstructor, originalConstructor);

  return trackedConstructor;
}

/**
 * Get all elements created from the given constructor.
 *
 * @param trackedConstructor - The constructor to get elements for.
 *
 * @internal scope: package
 */
export function getElements(
  trackedConstructor: HTMLElementConstructor,
): HTMLElement[] {
  const elements = elementsByConstructor.get(trackedConstructor);

  if (!elements) return [];

  const elementsArray: HTMLElement[] = [];

  for (const weakRef of elements) {
    const el = weakRef.deref();

    if (el) {
      elementsArray.push(el);
    } else {
      // Remove the weak reference if the element has been garbage collected
      elements.delete(weakRef);
    }
  }

  if (elements.size === 0) {
    // Clean up the map if there are no more tracked elements
    elementsByConstructor.delete(trackedConstructor);
  }

  return elementsArray;
}
