import { setSingularElementStyleProperty } from "./setSingularElementStyleProperty.ts";
import type { SingularElement, StyleObject } from "./types/mod.ts";

// Banned globals
declare const document: never;
declare const window: never;

type CSSRendererOptions = {
  /**
   * The document to use for rendering.
   * If not provided, the current document will be used.
   *
   * @remarks
   *
   * This is useful for containing the rendered elements in a specific document,
   * such as when server-side rendering.
   */
  document: Document;
};

class CSSRenderer {
  constructor(options: CSSRendererOptions) {
    this.#renderer = options.document.createElement("div");
  }

  /**
   * A reusable element to render the CSS
   */
  #renderer: HTMLDivElement;

  clear(): void {
    this.#renderer.style.cssText = "";
  }

  /**
   * Apply the given style object to the renderer
   */
  apply(value: StyleObject): void {
    setSingularElementStyleProperty(this.#renderer, undefined, value);
  }

  /**
   * Get the rendered CSS string
   */
  toString(): string {
    return this.#renderer.style.cssText;
  }
}

const renderers = new WeakMap<Document, CSSRenderer>();

/**
 * @internal scope: workspace
 */
export function renderCSS($document: Document, value: StyleObject): string {
  let renderer = renderers.get($document);

  if (!renderer) {
    renderer = new CSSRenderer({ document: $document });

    renderers.set($document, renderer);
  } else {
    renderer.clear();
  }

  renderer.apply(value);

  return renderer.toString();
}
