/// <reference lib="dom.iterable" />

import {
  createReference,
  ensureReference,
  type Observer,
  type Reference,
} from "@knyt/artisan";

import type { ReactiveController, ReactiveControllerHost } from "./ReactiveController";

function addFontFacesToDocument(
  ownerDocument: Document | null,
  fontFaces: Set<FontFace>,
): void {
  if (!ownerDocument) return;

  for (const fontFace of fontFaces) {
    // `fonts` is a "Set-like object", so we can use `has` to check for duplicates.
    // This may be unnecessary, but I'm not sure if `fonts` will handle duplicates,
    // like a `Set` would.
    // TODO: Perform cross-browser testing to see if `fonts` handles duplicates.
    if (!ownerDocument.fonts.has(fontFace)) {
      ownerDocument.fonts.add(fontFace);
    }
  }
}

/**
 * @alpha This is an experimental API. It will change in future versions.
 */
/*
 * ### Private Remarks
 *
 * Using `@font-face` rules in CSS is the preferred way to load fonts,
 * but often doesn't work when used inside a shadow root.
 *
 * As a result, this method provides a way to load fonts that will work
 * when used inside a shadow root.
 */
// TODO: Add tests for this controller.
export class FontFaceInclusionController
  implements ReactiveController, Observer<Document | null>
{
  #host: ReactiveControllerHost;
  #ownerDocument$: Reference.Readonly<Document | null>;

  // When the included font faces change, add them to the ownerDocument.
  #includedFontFaces$ = createReference(
    new Set<FontFace>(),
    (includedFontFaces) => {
      addFontFacesToDocument(this.#ownerDocument$.get(), includedFontFaces);
    },
  );

  constructor(
    host: ReactiveControllerHost,
    {
      ownerDocument,
    }: {
      ownerDocument: Reference.Maybe<Document>;
    },
  ) {
    this.#host = host;
    this.#ownerDocument$ = ensureReference(ownerDocument);

    this.#ownerDocument$.subscribe(this);
    host.addController(this);
  }

  hostConnected?: () => void;

  // When the ownerDocument changes, add the included font faces.
  next(ownerDocument: Document | null): void {
    addFontFacesToDocument(ownerDocument, this.#includedFontFaces$.get());
  }

  /**
   * Adds the given style fontFace to the included font faces.
   * If the style fontFace is already present, this is a no-op.
   */
  includeFontFace(fontFace: FontFace): void {
    const includedFontFaces = this.#includedFontFaces$.get();

    // Even though `Set` handles duplicates, we want to avoid unnecessary
    // updates to the included font faces.
    if (includedFontFaces.has(fontFace)) return;

    const nextIncludedFontFaces = new Set(includedFontFaces).add(fontFace);

    this.#includedFontFaces$.set(nextIncludedFontFaces);
  }

  /**
   * Removes the first occurrence of the given style fontFace from the adopted
   * style sheets.
   */
  removeFontFace(fontFace: FontFace): void {
    this.#dropFontFaceFromInternal(fontFace);
    this.#dropFontFaceFromRoot(fontFace);
  }

  /**
   * Removes the first occurrence of the given style fontFace from the
   * internal included font faces list.
   */
  #dropFontFaceFromInternal(fontFace: FontFace): void {
    const includedFontFaces = this.#includedFontFaces$.get();

    // Even though `Set` handles duplicates, we want to avoid unnecessary
    // updates to the included font faces.
    if (!includedFontFaces.has(fontFace)) return;

    const nextIncludedFontFaces = new Set(includedFontFaces);

    nextIncludedFontFaces.delete(fontFace);

    this.#includedFontFaces$.set(nextIncludedFontFaces);
  }

  /**
   * Removes the first occurrence of the given style fontFace from the ownerDocument's
   * included font faces.
   *
   * @remarks
   *
   * This is a no-op if the ownerDocument is not present.
   */
  #dropFontFaceFromRoot(fontFace: FontFace): void {
    this.#ownerDocument$.get()?.fonts.delete(fontFace);
  }
}
