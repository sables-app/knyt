import { isCSSMediaRule, isCSSStyleRule } from "@knyt/artisan";

/**
 * Converts a `CSSStyleSheet` to a string.
 */
export function cssStyleSheetToString(
  styleSheet: {
    readonly cssRules: CSSRuleList;
  },
  {
    includeMediaQueries = true,
  }: {
    includeMediaQueries?: boolean;
  } = {},
): string {
  let cssString = "";

  const rules = Array.from(styleSheet.cssRules);

  for (const rule of rules) {
    if (isCSSStyleRule(rule)) {
      cssString += `${rule.selectorText} { ${rule.style.cssText} }\n`;
    } else if (includeMediaQueries && isCSSMediaRule(rule)) {
      cssString += `@media ${rule.media.mediaText} {\n`;
      cssString += cssStyleSheetToString(rule, { includeMediaQueries });
      cssString += `}\n`;
    }
  }

  return cssString;
}
