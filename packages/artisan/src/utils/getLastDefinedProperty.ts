/**
 * Gets the last defined property from a list of items.
 *
 * @remarks
 *
 * The function uses the `in` operator to check if the prop exists in the item.
 * If the prop exists in the item, the value of the prop overrides the previous value.
 *
 * As a result, if a property is set to `undefined`, it will override any previous value and set the result to `undefined`.
 * To clarify, if any value is set on the given prop, it will take precedence over any previous value.
 */
export function getLastDefinedProperty<
  P extends keyof T,
  T extends Record<string, any>,
>(propName: P, ...items: readonly T[]): T[P] {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];

    if (propName in item) {
      return item[propName];
    }
  }

  return undefined as T[P];
}
