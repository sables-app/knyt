import {
  createReference,
  ensureReference,
  isCSSStyleSheet,
  type Observer,
  type Reference,
} from "@knyt/artisan";
import { getCSSStyleSheetConstructor } from "@knyt/tailor";

import type { ReactiveControllerHost } from "./ReactiveController";

/**
 * Normalizes the input into a `CSSStyleSheet` instance using
 * the local `CSSStyleSheet` constructor, if available.
 */
function normalizeCSSStyleSheet(
  input: StyleSheetAdoptionAdapter.Input,
  $CSSStyleSheet: typeof CSSStyleSheet | undefined,
): CSSStyleSheet {
  return isCSSStyleSheet(input) ? input : input.toCSSStyleSheet($CSSStyleSheet);
}

/**
 * Adds the given style sheets to the given root's adopted style sheets.
 */
function addStyleSheetsToRoot(
  root: ShadowRoot | Document | null,
  styleSheets: CSSStyleSheet[],
): void {
  if (!root) return;

  if (root.adoptedStyleSheets.length === 0) {
    root.adoptedStyleSheets = [...styleSheets];
    return;
  }

  for (const sheet of styleSheets) {
    // Even though we can add the same style sheet multiple times,
    // this controller will only add it once.
    // If there's a need to add the same style sheet multiple times,
    // the consumer should handle that.
    if (!root.adoptedStyleSheets.includes(sheet)) {
      root.adoptedStyleSheets.push(sheet);
    }
  }
}

/**
 * @internal scope: workspace
 */
/**
 * ### Private Remarks
 *
 * This is not a reactive controller, as it does not react to host updates.
 * It only responds to changes in the root reference.
 * Its purpose is to manage adopted style sheets for a root,
 * separating style sheet adoption from controller logic.
 * This makes its role clearer, especially in the context of HMR.
 */
export class StyleSheetAdoptionAdapter
  implements Observer<ShadowRoot | Document | null>
{
  #host: ReactiveControllerHost;
  #root$: Reference.Readonly<ShadowRoot | Document | null>;

  /**
   * A map of adopted style sheets by their input.
   */
  #adoptedStyleSheets$ = createReference(
    new Map<StyleSheetAdoptionAdapter.Input, CSSStyleSheet>(),
    () => this.#addStyleSheetsToRoot(),
  );

  get #$CSSStyleSheet() {
    return getCSSStyleSheetConstructor(this.#root$.get());
  }

  constructor(
    host: ReactiveControllerHost,
    { root }: { root: Reference.Maybe<ShadowRoot | Document> },
  ) {
    this.#host = host;
    this.#root$ = ensureReference(root);

    this.#root$.subscribe(this);
  }

  get #currentRoot() {
    return this.#root$.get();
  }

  get #currentCSSStyleSheets(): CSSStyleSheet[] {
    return Array.from(this.#adoptedStyleSheets$.get().values());
  }

  /**
   * Called when the host's root changes.
   *
   * @internal scope: module
   */
  next(root: ShadowRoot | Document | null): void {
    this.#addStyleSheetsToRoot();
  }

  /**
   * Adds the given style sheet to the adopted style sheets.
   * If the style sheet is already present, this is a no-op.
   */
  adoptStyleSheet(input: StyleSheetAdoptionAdapter.Input): void {
    const adoptedStyleSheets = this.#adoptedStyleSheets$.get();

    if (adoptedStyleSheets.has(input)) return;

    const cssStyleSheet = this.#normalizeCSSStyleSheet(input);
    const nextAdoptedStyleSheets = new Map(adoptedStyleSheets);

    nextAdoptedStyleSheets.set(input, cssStyleSheet);

    this.#adoptedStyleSheets$.set(nextAdoptedStyleSheets);
  }

  /**
   * Removes the first occurrence of the given style sheet from the adopted
   * style sheets.
   */
  dropStyleSheet(input: StyleSheetAdoptionAdapter.Input): void {
    const cssStyleSheet = this.#adoptedStyleSheets$.value.get(input);

    if (!cssStyleSheet) return;

    this.#dropInputFromMap(input);
    this.#dropStyleSheetFromRoot(cssStyleSheet);
  }

  /**
   * Checks whether the given input is already adopted.
   */
  hasStyleSheet(input: StyleSheetAdoptionAdapter.Input): boolean {
    return this.#adoptedStyleSheets$.get().has(input);
  }

  /**
   * Drops all adopted style sheets.
   */
  clearStyleSheets(): void {
    const styleSheets = this.#currentCSSStyleSheets;

    // Unregister all adopted style sheets by clearing the map.
    this.#adoptedStyleSheets$.set(new Map());

    for (const sheet of styleSheets) {
      this.#dropStyleSheetFromRoot(sheet);
    }
  }

  /**
   * Adds all currently adopted style sheets to the current root.
   */
  #addStyleSheetsToRoot() {
    addStyleSheetsToRoot(this.#currentRoot, this.#currentCSSStyleSheets);
  }

  /**
   * Normalizes the input into a `CSSStyleSheet` instance using
   * the local `CSSStyleSheet` constructor, if available.
   */
  #normalizeCSSStyleSheet(input: StyleSheetAdoptionAdapter.Input) {
    return normalizeCSSStyleSheet(input, this.#$CSSStyleSheet);
  }

  /**
   * Removes the registered input from the map of adopted style sheets.
   */
  #dropInputFromMap(input: StyleSheetAdoptionAdapter.Input): void {
    const adoptedStyleSheets = this.#adoptedStyleSheets$.get();

    if (!adoptedStyleSheets.has(input)) return;

    const nextAdoptedStyleSheets = new Map(adoptedStyleSheets);

    nextAdoptedStyleSheets.delete(input);

    this.#adoptedStyleSheets$.set(nextAdoptedStyleSheets);
  }

  /**
   * Removes the first occurrence of the given style sheet from the root's
   * adopted style sheets.
   *
   * @remarks
   *
   * This is a no-op if the root is not present.
   */
  #dropStyleSheetFromRoot(cssStyleSheet: CSSStyleSheet): void {
    const root = this.#root$.get();

    if (!root) return;

    const indexToRemove = root.adoptedStyleSheets.indexOf(cssStyleSheet);

    if (indexToRemove === -1) return;

    root.adoptedStyleSheets.splice(indexToRemove, 1);
  }
}

export namespace StyleSheetAdoptionAdapter {
  export type Input =
    | CSSStyleSheet
    | {
        toCSSStyleSheet: (
          CSSStyleSheetConstructor?: typeof CSSStyleSheet,
        ) => CSSStyleSheet;
      };
}
