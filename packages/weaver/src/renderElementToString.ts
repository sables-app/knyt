import { html } from "./ElementBuilder";
import { render, type RenderOptions } from "./render/mod";
import type { KnytDeclaration } from "./types/mod";

function getElementAttributes(el: Element): Record<string, string> {
  return el
    .getAttributeNames()
    .reduce<Record<string, string>>((result, name) => {
      const value = el.getAttribute(name);

      if (value !== null) {
        result[name] = value;
      }

      return result;
    }, {});
}

/**
 * Renders the given element to a string.
 *
 * @internal scope: workspace
 */
// TODO: This function is very similar to `renderElement` in the `render` module.
// Refactor to avoid duplication.
export async function renderElementToString({
  children,
  element,
  options,
  contents,
  shadowRootMode,
}: {
  children: string;
  element: Element;
  shadowRootMode?: ShadowRootMode;
  contents?: KnytDeclaration;
  options?: RenderOptions;
}): Promise<string> {
  const attributes = getElementAttributes(element);
  const tagName = element.tagName.toLowerCase();
  const resolvedContents = shadowRootMode
    ? html.template.shadowrootmode(shadowRootMode).$children(contents)
    : contents;

  return render(
    html[tagName]
      .$attrs(attributes)
      .$children(resolvedContents, html.fragment.$innerHTML(children)),
    options,
  );
}
