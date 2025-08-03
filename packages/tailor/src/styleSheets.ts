import type { CSS } from "@knyt/html-type";

import { StyleSheet } from "./StyleSheet";

/**
 * Creates a `StyleSheet` containing a single rule that sets
 * the display property of the host element.
 */
// TODO: Rename for clarity
export function hostDisplay(display: CSS.Property.Display) {
  return StyleSheet.fromRules({
    host: {
      selector: ":host",
      styles: {
        display,
      },
    },
  });
}
