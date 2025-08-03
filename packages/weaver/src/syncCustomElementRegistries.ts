import type { SingularElement } from "./types/mod";

/**
 * Attempt to copy a specific custom element from one registry to another.
 */
export function syncCustomElementRegistries(
  tagName: SingularElement.TagName.Input | undefined,
  originRegistry: CustomElementRegistry | undefined,
  destRegistry: CustomElementRegistry | undefined,
): void {
  if (!tagName || !originRegistry || !destRegistry) return;

  const elementConstructor = originRegistry.get(tagName);

  if (destRegistry.get(tagName) || !elementConstructor) {
    // Do nothing if the element is already defined in the destination registry,
    // or if the element is not defined in the origin registry.
    return;
  }

  destRegistry.define(
    tagName,
    elementConstructor,
    // We don't need to pass the options here
    // The `extends` option is only relevant when
    // running in a browser environment.
  );
}
