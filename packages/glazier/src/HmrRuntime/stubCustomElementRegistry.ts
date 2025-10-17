import {
  __knytElementComposedHotUpdate,
  isKnytElementComposedConstructor,
} from "@knyt/luthier";

import { getElements, trackElements } from "./trackElements.ts";

const __knytHmrStub = Symbol.for("knyt.luthier.hmr.stub");

function isCustomElementsStubbed(
  $customElements: CustomElementRegistry,
): boolean {
  return (
    __knytHmrStub in $customElements.define &&
    Boolean(($customElements.define as any)[__knytHmrStub])
  );
}

/**
 * Stub the `define` method of the given `CustomElementRegistry` to enable HMR
 * support for composed `KnytElement` custom elements.
 */
export function stubCustomElementRegistry(
  $customElements: CustomElementRegistry,
): void {
  if (isCustomElementsStubbed($customElements)) return;

  const originalDefine = $customElements.define.bind($customElements);

  $customElements.define = function define(
    name,
    nextConstructor,
    options,
  ): void {
    const prevConstructor = $customElements.get(name);

    if (!prevConstructor) {
      if (isKnytElementComposedConstructor(nextConstructor)) {
        // If there's no previous constructor, and the new one is a KnytElementComposed,
        // define it and track its instances.
        originalDefine(name, trackElements(nextConstructor), options);
        return;
      }

      // No previous constructor, and the new one is not a KnytElementComposed,
      // just define it. This shouldn't throw an error, because there's no previous definition.
      originalDefine(name, nextConstructor, options);
      return;
    }

    if (isKnytElementComposedConstructor(prevConstructor)) {
      if (isKnytElementComposedConstructor(nextConstructor)) {
        // If both constructors are KnytElementComposed, attempt to update
        // the previous constructor with the next one.
        //
        // The responsibility for handling hot updates is delegated to the
        // `KnytElementComposed` implementation. It should manage updating
        // existing instances as needed.
        //
        // If hot updates are not supported by the constructor,
        // then the method will be absent. If an update fails,
        // the method should handle it gracefully, and log an error.
        //
        // This approach avoids the complexity and potential errors of manually
        // updating instances here, and allows each `KnytElementComposed` version
        // to implement its own update strategy.

        if (!prevConstructor[__knytElementComposedHotUpdate]) {
          console.warn(
            `[Glazier:HMR] Cannot update <${name}>: the previous constructor does not support hot updates.`,
          );
          return;
        }

        // Call the hot update method with the previous constructor as `this`.
        prevConstructor[__knytElementComposedHotUpdate]({
          tagName: name,
          nextConstructor,
          instances: getElements(prevConstructor),
        });
        return;
      }

      console.warn(
        `[Glazier:HMR] Cannot update <${name}>: previous constructor is a KnytElementComposed, but the next one is not.`,
      );
      return;
    }

    if (isKnytElementComposedConstructor(nextConstructor)) {
      console.warn(
        `[Glazier:HMR] Cannot update <${name}>: next constructor is a KnytElementComposed, but the previous one is not.`,
      );
      return;
    }

    // Finally, if both constructors are not KnytElementComposed, just attempt to redefine.
    // This may throw a "custom element already defined" error, if another HMR strategy is not in place.
    // This is intentional.
    // We don't want to silently ignore this case, as it indicates a potential issue
    // with the HMR setup or the custom elements being redefined.
    originalDefine(name, nextConstructor, options);
  };

  Object.defineProperty($customElements.define, __knytHmrStub, { value: true });
}
