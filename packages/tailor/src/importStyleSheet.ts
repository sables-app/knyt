import { dom, html } from "@knyt/weaver";

/**
 * A utility function to import a CSS file using `@import`.
 *
 * @remarks
 *
 * Browsers do not support adopting a StyleSheet that uses `@import`.
 * As a result, we should add the CSS with the `@import` to the DOM using a style element.
 *
 * @example
 *
 * ```tsx
 * const fonts = StyleSheetImport("https://fonts.googleapis.com/css2?family=Inter");
 *
 * class MyComponent extends KnytElement {
 *   render() {
 *    return dom.fragment.$(
 *      fonts.style(),
 *      "Hello, World!"
 *    );
 *   }
 * }
 */
export function importStyleSheet(url: string) {
  const css = `@import url('${url}');`;

  const style = () => {
    return dom.style.$(css);
  };

  style.html = () => {
    return html.style.$(css);
  };

  return { style };
}
