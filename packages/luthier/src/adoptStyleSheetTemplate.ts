import type { StyleSheet } from "@knyt/tailor";
import { defineView, html } from "@knyt/weaver";

// We're avoiding importing `define` to help tree-shaking and reduce bundle size.
import { defineKnytElement } from "./define/defineKnytElement";
import { defineProperty } from "./define/defineProperty";

/**
 * A custom element that adopts a style sheet into the parent document.
 */
const StyleSheetAdopter = defineKnytElement({
  tagName: "knyt-stylesheet-adopter",
  properties: {
    /**
     * The style sheet to adopt.
     *
     * @remarks
     *
     * This property is used to adopt a style sheet into the parent document.
     * The given style sheet should be a static value.
     *
     * The `adoptStyleSheet` method will prevent the exact same style sheet
     * from being adopted multiple times, but it will not prevent
     * different style sheets from being adopted multiple times.
     *
     * This property is not reactive, meaning that after the initial adoption,
     * changes to the style sheet property will not result in the style sheet
     * being re-adopted.
     *
     * Changes made to the style sheet itself (e.g., adding or removing rules)
     * will be reflected in the document, as such operations are self-contained
     * within the style sheet.
     */
    styleSheet: defineProperty().styleSheet(),
  },
  options: {
    renderMode: "opaque",
    shadowRoot: false,
  },
  lifecycle() {
    let hasAdopted = false;

    this.onPropChange("styleSheet", (styleSheet) => {
      if (hasAdopted || !styleSheet) return;

      hasAdopted = true;

      this.adoptStyleSheet(styleSheet);
    });

    return () => html.fragment;
  },
});

/**
 * Returns a template that adopts the specified style sheet into the parent document.
 *
 * @remarks
 *
 * On the server, this template renders a `<style>` element with the CSS rules from the given style sheet.
 * On the client, it adopts the style sheet into the parent document, ensuring it is only applied once,
 * even if the template is rendered multiple times.
 *
 * @internal scope: workspace
 * @deprecated This doesn't work. WIP
 */
export function adoptStyleSheetTemplate(styleSheetToAdopt: StyleSheet<any>) {
  return defineView(() =>
    StyleSheetAdopter().styleSheet(styleSheetToAdopt),
  );
}
