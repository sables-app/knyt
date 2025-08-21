import { type ReactiveController } from "@knyt/tasker";

/**
 * @internal scope: package
 */
export namespace HtmxObject {
  /**
   * Represents the `htmx` object as used by the KnytElement.
   */
  export type Internal = {
    process: (root: DocumentOrShadowRoot) => unknown;
  };
  /**
   * Represents the `htmx` object as defined in the `htmx.org` package.
   *
   * @remarks
   *
   * This type is necessary to ensure compatibility with the `htmx.org` package,
   * because it's types are incorrect, and don't allow for processing ShadowRoots.
   */
  export type Compat = {
    process: (elt: Element | string) => void;
  };
}

declare const htmx: HtmxObject.Internal | undefined;

export class HtmxIntegration implements ReactiveController {
  readonly #shadowRoot: ShadowRoot;
  readonly #htmxObject: HtmxObject.Internal | undefined;

  constructor(htmxInput: true | HtmxObject.Compat, shadowRoot: ShadowRoot) {
    this.#shadowRoot = shadowRoot;

    if (typeof htmxInput === "object") {
      // First, attempt to use the provided htmx option.
      //The type assertion is necessary. See the `HtmxObject.Compat` type for more details.
      this.#htmxObject = htmxInput as unknown as HtmxObject.Internal;
    } else if (typeof htmx === "object") {
      // Second, try to use the global `htmx` object.
      this.#htmxObject = htmx;
    } else {
      console.error(
        new Error(
          "htmx must be either passed as an option to the element or made available globally.",
        ),
      );
    }
  }

  hostUpdated() {
    this.#htmxObject?.process(this.#shadowRoot);
  }
}
