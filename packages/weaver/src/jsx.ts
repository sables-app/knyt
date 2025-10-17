import { dom } from "./ElementBuilder.ts";
import type {
  AnyProps,
  AttributeDictionary,
  ElementBuilder,
  KnytDeclaration,
  ViewBuilder,
} from "./types/mod.ts";

/*
 * ### Private Remarks
 *
 * tldr;
 *
 * If you're looking for a React compatible alternative, use Preact.
 *
 * ---
 *
 * The `ref` and `children` props are considered special,
 * because they are not passed to the element builder as
 * props.
 *
 * Although `ref` and `children` are both prefixed with `$`
 * in the Builder API, they are not prefixed with `$` in the
 * JSX API. This is because `children` is a special prop that
 * is required to implement the jsx-runtime API. For consistency,
 * the `ref` prop is also not prefixed with `$`.
 *
 * However, I want to note that this is NOT a precursor to
 * implementing full React JSX compatibility. The JSX interface
 * is not intended to be compatible with React or any
 * other library. The intention is to provide an interface
 * for JSX tools like MDX to integrate with the Knyt renderer.
 */
type JsxSpecialProps<E extends AnyProps> = {
  /**
   * The ref callback for the element.
   */
  ref?: ElementBuilder.Ref<E>;
  /**
   * Children for the element.
   */
  children?: ElementBuilder.Child | ElementBuilder.ChildrenInput;
};

type ElementBuilderToJsxProps<T extends ElementBuilder> =
  ElementBuilder.PropsInput<
    Omit<KnytDeclaration.ToProps<T>, keyof JsxSpecialProps<AnyProps>>,
    KnytDeclaration.ToAssignmentMethod<T>
  > &
    JsxSpecialProps<KnytDeclaration.ToNode<T>>;

/**
 * The input props for the `h` function.
 * This type adds support for the `key` and `ref` props.
 */
type JsxProps<T extends KnytDeclaration> =
  | (T extends ElementBuilder
      ? ElementBuilderToJsxProps<T>
      : T extends ViewBuilder
        ? ViewBuilder.ToProps<T>
        : {})
  | null;

/**
 * Creates an element builder for the given element.
 *
 * @internal scope: workspace
 * @alpha
 *
 * @remarks
 *
 * This function is a convenience function for creating element builders,
 * using a familiar syntax to `h` functions in other libraries like React,
 * Preact, and Vue.
 */
/*
 * ### Private Remarks
 *
 * Knyt's JSX implementation currently doesn't support SVG elements.
 * To build SVG elements, the SVG should be written as a template, and
 * then the template can be used with JSX syntax.
 */
// For accepting element builders
export function jsx<T extends KnytDeclaration>(
  elementBuilderFactory: () => T,
  props?: JsxProps<T> | null,
  key?: string,
): T;

// For accepting known HTML elements
export function jsx<T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  props?: JsxProps<
    ElementBuilder<HTMLElementTagNameMap[T], HTMLElementTagNameMap[T], "dom">
  > | null,
  key?: string,
): ElementBuilder.DOM<HTMLElementTagNameMap[T]>;

// For accepting unknown custom HTML elements
export function jsx<P extends AnyProps = AnyProps>(
  tagName: string,
  props?: JsxProps<ElementBuilder<P, HTMLElement, "dom">> | null,
  key?: string,
): ElementBuilder.DOM<P>;

export function jsx(
  input: string | (() => ElementBuilder),
  props?: AnyProps | null,
  key?: string,
): ElementBuilder {
  let tagName: string | undefined;
  let elementBuilder: ElementBuilder;

  if (typeof input === "string") {
    tagName = input;
    elementBuilder = dom[input];
  } else {
    elementBuilder = input();
  }

  if (typeof key === "string") {
    elementBuilder = elementBuilder.$key(key);
  }
  if (!props) {
    return elementBuilder;
  }

  type InternalProps = JsxSpecialProps<AnyProps> & Record<string, unknown>;

  // Exclude the `children` and `ref` props from the other props,
  // because they are special props and should not be passed
  // to the element builder.
  const { children, ref, ...otherProps } = props as InternalProps;
  const separatedProps = separatePropsFromAttributes(tagName, otherProps);

  elementBuilder = elementBuilder
    .$props(separatedProps.props)
    .$attrs(separatedProps.attrs);

  if (typeof ref === "function") {
    elementBuilder = elementBuilder.$ref(ref);
  }
  if (children) {
    const resolvedChildren = Array.isArray(children) ? children : [children];

    elementBuilder = elementBuilder.$children(...resolvedChildren);
  }

  return elementBuilder;
}

/**
 * Regular expression to match prefixed attributes that should be separated
 * from props in JSX.
 *
 * - `aria-` for ARIA attributes
 * - `data-` for custom data attributes
 * - `hx-` for htmx attributes
 */
const prefixedAttributeRegex = /^(aria-|data-|hx-)/;

/**
 * These are the prop names that should be treated as attributes in JSX.
 * This is due to the inconsistency between traditional HTML attributes
 * and the properties that are set on elements in JSX.
 */
/*
 * ### Private Remarks
 *
 * Knyt's element builders allow explicit declaration of attributes,
 * whereas JSX does not distinguish between attributes and properties.
 * To bridge this gap, we identify props that match certain patterns
 * (such as specific prefixes or known attribute names) and collect
 * them into an attributes dictionary. This enables Knyt's jsx-runtime
 * to handle attributes correctly, even though JSX itself does not
 * provide a separate mechanism for declaring them.
 */
const propsAsAttributes = {
  input: {
    checked: true,
    value: true,
    readonly: true,
    disabled: true,
    multiple: true,
  },
  textarea: {
    value: true,
    readonly: true,
    disabled: true,
  },
  select: {
    value: true,
    disabled: true,
    multiple: true,
  },
  option: {
    selected: true,
  },
  button: {
    disabled: true,
  },
} as const;

/**
 * Determines if a given key should be treated as an attribute key
 * based on the tag name and the key itself.
 */
function isAttributeKey(tagName: string | undefined, key: string): boolean {
  if (prefixedAttributeRegex.test(key)) return true;

  if (!tagName) return false;

  const loweredTagName = tagName.toLowerCase();

  if (!(loweredTagName in propsAsAttributes)) return false;

  const attributes =
    propsAsAttributes[loweredTagName as keyof typeof propsAsAttributes];

  if (!(key in attributes)) return false;

  return attributes[key as keyof typeof attributes] === true;
}

/**
 * Separates the props from the attributes.
 *
 * @remarks
 *
 * Separates props that match the attribute regex into an attributes dictionary.
 * These props are specially handled by Knyt's jsx-runtime, because unlike Knyt's
 * element builders, JSX doesn't provide a way to explicitly declare attributes
 * separately from properties.
 *
 * @internal scope: workspace
 */
export function separatePropsFromAttributes(
  tagName: string | undefined,
  input: AnyProps,
): {
  props: AnyProps;
  attrs: AttributeDictionary;
} {
  const props: AnyProps = {};
  const attrs: AttributeDictionary = {};

  for (const [key, value] of Object.entries(input)) {
    if (isAttributeKey(tagName, key)) {
      attrs[key] = value;
    } else {
      props[key] = value;
    }
  }

  return { props, attrs };
}

export function Fragment() {
  return dom.fragment;
}

export { jsx as jsxs, jsx as jsxDEV };
