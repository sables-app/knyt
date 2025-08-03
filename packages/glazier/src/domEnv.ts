import { Browser, type BrowserPage } from "happy-dom";

// Banned globals
declare const customElements: never;
declare const document: never;
declare const HTMLElement: never;
declare const window: never;

/**
 * @internal scope: workspace
 */
const GLOBAL_REGISTRATION_FLAG = "__KNYT_BUN_GLOBAL_REGISTRATION__";

/**
 * @internal scope: workspace
 */
export type Page = {
  browserPage: BrowserPage;
  $document: Document;
  $HTMLElement: typeof globalThis.HTMLElement;
  $window: Window;
};

/**
 * The names of the properties that are stubbed
 *
 * @internal scope: workspace
 */
enum StubPropertyName {
  /**
   * Stub `document` globally for rendering stylesheets
   * The global document should _only_ be used for rendering styles.
   */
  Document = "document",
  /**
   * Stub `customElements` globally to register them across multiple documents
   */
  CustomElements = "customElements",
  /**
   * Stub `HTMLElement` globally so that KnytElement can extend it
   */
  HTMLElement = "HTMLElement",
}

/**
 * The names of the properties that are stubbed
 *
 * @internal scope: workspace
 */
const stubPropertyNames = Object.values(StubPropertyName);

/**
 * Tracks changes made to the global environment.
 *
 * @remarks
 *
 * This is used to determine if a property has been
 * set by the plugin.
 *
 * - If `true`, the property was set by the plugin.
 * - If `false`, the property already existed in the
 * global environment and was not set by the plugin.
 */
const changesMade: Record<StubPropertyName, boolean> = {
  document: false,
  customElements: false,
  HTMLElement: false,
};

/**
 * The browser instance used for all pages.
 *
 * @internal scope: workspace
 */
let globalBrowser: Browser | undefined;

/**
 * The page exposed on `globalThis`.
 *
 * @internal scope: workspace
 */
let globalPage: Page | undefined;

/**
 * Creates a new document for parsing.
 *
 * @internal scope: workspace
 */
export function createPage(): Page {
  if (!globalBrowser) {
    globalBrowser = new Browser();
  }

  const page = globalBrowser.newPage();

  // Type casts because happy-dom's document is not
  // compatible with the standard DOM lib.
  const $window = page.mainFrame.window as unknown as Window;
  const $document = page.mainFrame.document as unknown as Document;
  const $HTMLElement = page.mainFrame.window
    .HTMLElement as unknown as typeof globalThis.HTMLElement;

  return { browserPage: page, $document, $HTMLElement, $window };
}

function isGloballyRegistered() {
  return Boolean((globalThis as any)[GLOBAL_REGISTRATION_FLAG]);
}

/**
 * @remarks
 *
 * This should be called once per process.
 *
 * @public
 */
/*
 * ### Private Remarks
 *
 * Do not expose the window globally.
 *
 * This function could be synchronous, but for future-proofing
 * and consistency, we'll make it async. Bun supports module
 * top-level await, so it should be a non-issue.
 */
export async function registerGlobals(): Promise<void> {
  if (isGloballyRegistered()) {
    console.warn("Global registration already done. Skipping.");
    return;
  }

  // This page should stay open for the lifetime of the process.
  // The custom elements registry stops working if the page is closed.
  globalPage = createPage();

  const { $document, $HTMLElement, $window } = globalPage;

  const stubs: Record<StubPropertyName, any> = {
    document: $document,
    customElements: $window.customElements,
    HTMLElement: $HTMLElement,
  };

  for (const propName of stubPropertyNames) {
    if (!globalThis[propName]) {
      globalThis[propName] = stubs[propName];
      changesMade[propName] = true;
    }
  }
}

/**
 * Reverts the changes made to the global environment.
 */
export async function unregisterGlobals(): Promise<void> {
  if (!isGloballyRegistered()) {
    console.warn("Global registration not done. Skipping.");
    return;
  }

  for (const propName of stubPropertyNames) {
    if (changesMade[propName]) {
      delete (globalThis as any)[propName];
      changesMade[propName] = false;
    }
  }

  await globalPage?.browserPage.close();
  await globalBrowser?.close();

  globalPage = undefined;
  globalBrowser = undefined;
}
