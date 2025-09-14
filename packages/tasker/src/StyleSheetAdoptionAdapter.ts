import {
  createReference,
  ensureReference,
  isCSSStyleSheet,
  type Observer,
  type Reference,
} from "@knyt/artisan";
import { getCSSStyleSheetConstructor } from "@knyt/tailor";

import type {
  ReactiveController,
  ReactiveControllerHost,
} from "./ReactiveController";

function normalizeCSSStyleSheet(
  input: StyleSheetAdoptionAdapter.Input,
  $CSSStyleSheet: typeof CSSStyleSheet | undefined,
): CSSStyleSheet {
  return isCSSStyleSheet(input) ? input : input.toCSSStyleSheet($CSSStyleSheet);
}

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
 * @beta The interface for this controller is still experimental and may change in future releases.
 */
export class StyleSheetAdoptionAdapter
  implements ReactiveController, Observer<ShadowRoot | Document | null>
{
  #host: ReactiveControllerHost;
  #root$: Reference.Readonly<ShadowRoot | Document | null>;

  // When the adopted style sheets change, add them to the root.
  #adoptedStyleSheets$ = createReference<CSSStyleSheet[]>(
    [],
    (adoptedStyleSheets) => {
      addStyleSheetsToRoot(this.#root$.get(), adoptedStyleSheets);
    },
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
    host.addController(this);
  }

  hostConnected?: () => void;

  // When the root changes, add the adopted style sheets.
  next(root: ShadowRoot | Document | null): void {
    addStyleSheetsToRoot(root, this.#adoptedStyleSheets$.get());
  }

  #normalizeCSSStyleSheet(input: StyleSheetAdoptionAdapter.Input) {
    return normalizeCSSStyleSheet(input, this.#$CSSStyleSheet);
  }

  /**
   * Adds the given style sheet to the adopted style sheets.
   * If the style sheet is already present, this is a no-op.
   */
  adoptStyleSheet(input: StyleSheetAdoptionAdapter.Input): void {
    const cssStyleSheet = this.#normalizeCSSStyleSheet(input);
    const adoptedStyleSheets = this.#adoptedStyleSheets$.get();

    if (adoptedStyleSheets.includes(cssStyleSheet)) return;

    this.#adoptedStyleSheets$.set([...adoptedStyleSheets, cssStyleSheet]);
  }

  /**
   * Removes the first occurrence of the given style sheet from the adopted
   * style sheets.
   */
  dropStyleSheet(input: StyleSheetAdoptionAdapter.Input): void {
    const cssStyleSheet = this.#normalizeCSSStyleSheet(input);

    this.#dropStyleSheetFromInternal(cssStyleSheet);
    this.#dropStyleSheetFromRoot(cssStyleSheet);
  }

  /**
   * Removes the first occurrence of the given style sheet from the
   * internal adopted style sheets list.
   */
  #dropStyleSheetFromInternal(cssStyleSheet: CSSStyleSheet): void {
    const adoptedStyleSheets = this.#adoptedStyleSheets$.get();
    const indexToRemove = adoptedStyleSheets.indexOf(cssStyleSheet);

    if (indexToRemove === -1) return;

    const nextAdoptedStyleSheets = [...adoptedStyleSheets];

    nextAdoptedStyleSheets.splice(indexToRemove, 1);

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
