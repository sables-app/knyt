export function htmlToDocumentFragment(
  $document: Document,
  html: string,
): DocumentFragment {
  const templateEl = $document.createElement("template");

  templateEl.innerHTML = html;

  return templateEl.content;
}
