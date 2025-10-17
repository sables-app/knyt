import type { ClassNameDictionary } from "./types.ts";

// TODO: Remove overloads and use a single function signature with a rest parameter.
/**
 * Merge multiple class name dictionaries into a single dictionary.
 */
// Support 2 class name dictionaries
export function mergeClassNames<
  RuleNameA extends string,
  RuleNameB extends string,
>(
  classNamesA: ClassNameDictionary<RuleNameA> | undefined,
  classNamesB: ClassNameDictionary<RuleNameB> | undefined,
): ClassNameDictionary<RuleNameA | RuleNameB>;
// Support 3 class name dictionaries
export function mergeClassNames<
  RuleNameA extends string,
  RuleNameB extends string,
  RuleNameC extends string,
>(
  classNamesA: ClassNameDictionary<RuleNameA> | undefined,
  classNamesB: ClassNameDictionary<RuleNameB> | undefined,
  classNamesC: ClassNameDictionary<RuleNameC> | undefined,
): ClassNameDictionary<RuleNameA | RuleNameB | RuleNameC>;
// Support an array of class name dictionaries with no type information
export function mergeClassNames<N extends string>(
  ...classNamesCollection: ReadonlyArray<
    ClassNameDictionary<string> | undefined
  >
): ClassNameDictionary<string>;
// Implementation
export function mergeClassNames<N extends string>(
  ...classNamesCollection: ReadonlyArray<
    ClassNameDictionary<string> | undefined
  >
): ClassNameDictionary<string> {
  const mergedClassNames = {} as Partial<Record<string, string>>;

  for (const classNames of classNamesCollection) {
    if (!classNames) continue;

    for (const entry of Object.entries(classNames)) {
      const [key, value] = entry as [N, string];
      const existingValue = mergedClassNames[key];

      mergedClassNames[key] = existingValue
        ? `${existingValue} ${value}`
        : value;
    }
  }

  return mergedClassNames as ClassNameDictionary<string>;
}
