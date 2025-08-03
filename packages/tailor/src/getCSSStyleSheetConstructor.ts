import { isDocument, isShadowRoot } from "@knyt/artisan";

export function getCSSStyleSheetConstructor(
  documentOrShadow: DocumentOrShadowRoot | undefined | null,
): typeof CSSStyleSheet {
  let $document: Document | undefined;

  if (isShadowRoot(documentOrShadow)) {
    $document = documentOrShadow.host.ownerDocument;
  } else if (isDocument(documentOrShadow)) {
    $document = documentOrShadow;
  } else if (documentOrShadow == null) {
    $document = globalThis.document as Document | undefined;
  } else {
    throw new Error(
      "Invalid document or shadow root. Must be a Document or ShadowRoot.",
    );
  }

  const $CSSStyleSheet =
    $document?.defaultView?.CSSStyleSheet ??
    (globalThis.CSSStyleSheet as typeof CSSStyleSheet | undefined);

  if (!$CSSStyleSheet) {
    throw new Error("CSSStyleSheet is not available in this environment.");
  }

  return $CSSStyleSheet;
}
