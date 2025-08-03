import { ElementDeclarationKind, ElementDeclarationSymbol } from "../constants";
import type {
  ElementBuilder,
  ElementDeclaration,
  HTMLElementTagName,
} from "../types/mod";

/**
 * @internal scope: workspace
 */
export function createMarkupDeclaration(
  tagName: string,
  attributes: ElementDeclaration.Attributes | undefined,
  children: readonly ElementBuilder.Child[],
): ElementDeclaration.MarkupHTML {
  return {
    [ElementDeclarationSymbol]: true,
    type: tagName.toLowerCase() as HTMLElementTagName,
    kind: ElementDeclarationKind.MarkupHTML,
    props: {},
    children,
    ref: undefined,
    key: undefined,
    listeners: undefined,
    renderMode: undefined,
    attributes,
  };
}
