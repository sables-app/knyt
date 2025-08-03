import type { StyleSheet } from "./StyleSheet";

export function areStyleSheetsEqual(
  a: StyleSheet<any> | undefined,
  b: StyleSheet<any> | undefined,
) {
  if (a === b) return true;
  if (!a || !b) return false;

  return a.equals(b);
}
