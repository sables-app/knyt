import {
  ElementDeclarationKind,
  ElementDeclarationSymbol,
  FragmentTypeSymbol,
} from "../constants.ts";
import type {
  ElementBuilder,
  ElementDeclaration,
  StringDocumentFragment,
} from "../types/mod.ts";
import { createStringDocumentFragment } from "./StringDocumentFragment.ts";

/**
 * Creates a fragment declaration for grouping children without
 * extra wrapper nodes.
 *
 * @internal scope: workspace
 *
 * @param children The children of the fragment.
 * @returns A fragment declaration.
 */
export function createFragmentDeclaration(
  children: readonly ElementBuilder.Child[],
): ElementDeclaration.Fragment {
  return {
    [ElementDeclarationSymbol]: true,
    type: FragmentTypeSymbol,
    // The `kind` doesn't really matter here, because all fragments
    // are treated equally by the renderer, but the `kind`
    // can represent the intended use of the fragment.
    kind: ElementDeclarationKind.MarkupHTML,
    props: {},
    children,
    ref: undefined,
    key: undefined,
    listeners: undefined,
    renderMode: undefined,
    attributes: undefined,
  };
}

/**
 * Creates a fragment declaration from a template literal markup and values.
 *
 * @internal scope: workspace
 */
export function createFragmentDeclarationFromMarkup(
  markup: TemplateStringsArray,
  values: StringDocumentFragment.Value[],
): ElementDeclaration.Fragment {
  return createFragmentDeclaration([
    createStringDocumentFragment(markup, values),
  ]);
}
