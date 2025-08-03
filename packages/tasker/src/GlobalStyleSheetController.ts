import type { StyleSheet } from "@knyt/tailor";
import { build } from "@knyt/weaver";

// Banned globals
declare const document: never;
declare const window: never;

/**
 * Options for the GlobalStyleSheetController.
 *
 * @alpha This is an experimental API. It will change in future versions.
 */
type GlobalStyleSheetControllerOptions = {
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

/**
 * This controller should be added before the host is connected.
 *
 * @alpha This is an experimental API. It will change in future versions.
 */
class GlobalStyleSheetController {
  #styleSheet: StyleSheet<any>;
  #styleElement: HTMLStyleElement | null = null;
  #document: Document;

  constructor(
    styleSheet: StyleSheet<any>,
    options: GlobalStyleSheetControllerOptions = {},
  ) {
    this.#styleSheet = styleSheet;
    this.#document = options.document ?? globalThis.document;
  }

  async injectStyleSheet() {
    if (this.#styleElement) return;

    this.#styleElement = await build<HTMLStyleElement>(
      this.#styleSheet.style(),
    );

    this.#document.body.appendChild(this.#styleElement);
  }

  removeStyleSheet() {
    if (!this.#styleElement) return;

    this.#document.body.removeChild(this.#styleElement);

    this.#styleElement = null;
  }

  hostConnected() {
    this.injectStyleSheet();
  }

  hostDisconnected() {
    this.removeStyleSheet();
  }
}

/**
 * @alpha This is an experimental API. It will change in future versions.
 */
// TODO: Rename for conciseness
export function createGlobalStyleSheetController(
  styleSheet: StyleSheet<any>,
  options?: GlobalStyleSheetControllerOptions,
) {
  return new GlobalStyleSheetController(styleSheet);
}
