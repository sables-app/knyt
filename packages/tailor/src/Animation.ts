import type { StyleObject } from "@knyt/weaver";

import { DEFAULT_NAME_PREFIX } from "./constants";
import { hashString } from "./hashString";
import { serializeCSSObject } from "./serializeCSSObject";
import type { CSSSerializable } from "./types";

// Banned globals
declare const document: never;
declare const window: never;

type AnimationOptions = {
  /**
   * The document to use for rendering.
   * If not provided, the current document will be used.
   *
   * @remarks
   *
   * This is useful for containing the rendered elements in a specific document,
   * such as when server-side rendering.
   */
  document?: Document;
};

type Keyframes = Record<string, StyleObject>;

type RenderedAnimation = {
  readonly name: string;
  readonly cssString: string;
};

export class Animation implements CSSSerializable {
  /**
   * Creates a new animation from the provided keyframes.
   */
  static keyframes(keyframes: Keyframes, options?: AnimationOptions) {
    return new Animation(keyframes, options);
  }

  #keyframes: Keyframes;

  #rendered?: RenderedAnimation;

  #getRendered(): RenderedAnimation {
    if (this.#rendered === undefined) {
      this.#rendered = this.#render();
    }

    return this.#rendered;
  }

  get name() {
    return this.#getRendered().name;
  }

  toCSSString() {
    return this.#getRendered().cssString;
  }

  /**
   * The document to use for rendering.
   */
  #document: Document;

  /**
   * Prefix for serialized names.
   */
  // TODO: Expose this as an option.
  #namePrefix = DEFAULT_NAME_PREFIX;

  constructor(keyframes: Keyframes, options: AnimationOptions = {}) {
    this.#document = options.document ?? globalThis.document;
    this.#keyframes = keyframes;
  }

  #render(): RenderedAnimation {
    const steps = Object.entries(this.#keyframes).map(([progress, value]) => {
      return [progress, serializeCSSObject(this.#document, value)] as const;
    });

    const animationHash = hashString(
      steps.reduce((result, [progress, { hash }]) => {
        return `${result}-${progress}-${hash}`;
      }, ""),
    );

    const name = `${this.#namePrefix}-${animationHash}`;

    const cssString = `@keyframes ${name} {
      ${steps
        .map(([progress, { declarationBlock }]) => {
          return `${progress} { ${declarationBlock} }`;
        })
        .join("\n")}
    }`;

    return {
      name,
      cssString,
    };
  }
}
