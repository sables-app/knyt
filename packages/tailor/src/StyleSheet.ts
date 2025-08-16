import type { Subscription } from "@knyt/artisan";
import {
  actionCreatorFactory,
  createSelector,
  Store,
  type AnyAction,
} from "@knyt/clerk";
import {
  dom,
  html,
  type ElementBuilder,
  type ResourceRenderer,
  type StyleObject,
} from "@knyt/weaver";
import { sha256 } from "@noble/hashes/sha256";

import { DEFAULT_NAME_PREFIX } from "./constants";
import { cssIncludeToString } from "./cssIncludeToString";
import { cssStyleSheetToString } from "./cssStyleSheetToString";
import { getCSSStyleSheetConstructor } from "./getCSSStyleSheetConstructor";
import { serializeCSSObject } from "./serializeCSSObject";
import type {
  ClassNameDictionary,
  CSSDeclarationBlock,
  CSSInclude,
  CSSObjectHash,
  CSSRules,
  CSSSerializable,
  CSSString,
  KnytCSSRuleInput,
  SelectorCreator,
  SerializedCSSObject,
  SerializedName,
  StyleSheetMixin,
} from "./types";

// Banned globals
declare const document: never;
declare const window: never;

function parseRuleNameInput<N extends string>(
  input: N,
): {
  ruleName: N;
  pseudoSuffix: string;
} {
  const pieces = input.split(":");
  const isPseudo = pieces.length > 1;
  const [ruleName, ...pseudoPieces] = pieces;
  const pseudoSuffix = isPseudo ? `:${pseudoPieces.join(":")}` : "";

  return {
    ruleName: ruleName as N,
    pseudoSuffix,
  };
}

/**
 * A list of selector names that should be treated as verbatim selectors.
 */
const verbatimSelectorNames = [":root", ":host"];
const verbatimPrefixes = ["::slotted(", ":host-context("];

function isVerbatimSelector(input: string): boolean {
  return (
    verbatimSelectorNames.includes(input) ||
    verbatimPrefixes.some((selectorName) => input.startsWith(selectorName))
  );
}

function createSelectorCreator<N extends string>(input: N): SelectorCreator<N> {
  if (isVerbatimSelector(input)) {
    return () => input;
  }

  const { ruleName, pseudoSuffix } = parseRuleNameInput(input);

  return (serializedNames: ClassNameDictionary<N>) => {
    return `.${serializedNames[ruleName as N]}${pseudoSuffix}`;
  };
}

function getInputSelector<N extends string>(
  ruleName: N,
  input: KnytCSSRuleInput<N>,
): SelectorCreator<N> {
  if ("selector" in input) {
    const selector = input.selector;

    return typeof selector === "function" ? selector : () => selector;
  }

  return createSelectorCreator(ruleName);
}

function getInputCSSObject<N extends string>(
  input: KnytCSSRuleInput<N>,
): StyleObject {
  if ("selector" in input) {
    return input.styles;
  }

  return input;
}

// NOTE: Nested rule support is not implemented here to preserve type safety.
// TODO: Consider enhancing CSS support directly rather than extending style objects for this.
function inputToRulePayloads<N extends string>(
  ruleName: N,
  input: KnytCSSRuleInput<N>,
): Actions.AddRulePayload<N>[] {
  return [
    {
      ruleName,
      selectorCreator: getInputSelector(ruleName, input),
      styles: getInputCSSObject(input),
    },
  ];
}

/**
 * @internal scope: package
 */
type StyleSheetState<N extends string> = {
  /**
   * @internal scope: package
   */
  addedRules: Actions.AddRulePayload<N>[];
  /**
   * A cache of serialized CSS objects
   *
   * @internal scope: package
   */
  serializedCache: {
    [K in CSSObjectHash]?: CSSDeclarationBlock;
  };
  /**
   * @internal scope: package
   */
  cssObjectHashBySelectorCreator: Map<SelectorCreator<N>, CSSObjectHash>;
  /**
   * @internal scope: package
   */
  serializedNamesByRuleName: {
    readonly [K in N]?: SerializedName;
  };
  /**
   * CSS to be included at the top of the stylesheet.
   *
   * @internal scope: package
   */
  includedCSS: CSSString[];
};

/**
 * A class that represents a CSS style sheet.
 *
 * @public
 */
export class StyleSheet<in out T extends CSSRules<string>>
  extends Store<StyleSheetState<CSSRules.ToRuleName<T>>>
  implements CSSSerializable, ResourceRenderer
{
  static fromCSS(
    input: CSSInclude,
    options?: StyleSheet.Options,
  ): StyleSheet<{}> {
    const styleSheet = new StyleSheet<{}>(options);

    styleSheet.include(input);

    return styleSheet;
  }

  /**
   * Create a new `StyleSheet` from a set of rules.
   *
   * @remarks
   *
   * Despite the rules being passed as an object, the order of the rules is
   * maintained in the stylesheet. This is important for specificity.
   */
  /*
   * ### Private Remarks
   *
   * I decided to use an object for the rules, because it's easier to work with
   * and more readable. The order of the rules is maintained by using `Object.entries`
   * to iterate over the rules.
   */
  static fromRules<T extends CSSRules<string>>(
    rules: T & CSSRules<string>,
    options?: StyleSheet.Options,
  ): StyleSheet<T> {
    type N = CSSRules.ToRuleName<T>;
    const styleSheet = new StyleSheet<T>(options);

    for (const entry of Object.entries(rules)) {
      const [ruleName, input] = entry as [N, KnytCSSRuleInput<N>];
      const payloads = inputToRulePayloads<N>(ruleName, input);

      for (const payload of payloads) {
        styleSheet.addRule(payload);
      }
    }

    return styleSheet;
  }

  static fromCSSStyleSheet(
    cssStyleSheet: CSSStyleSheet,
    options?: StyleSheet.Options,
  ): StyleSheet<{}> {
    return this.fromCSS(cssStyleSheetToString(cssStyleSheet), options);
  }

  /**
   * @deprecated Use `isStyleSheet` directly instead.
   */
  static isStyleSheet = isStyleSheet;

  /**
   * The document to use for rendering.
   */
  #document: Document;

  /**
   * Whether to disable server-side rendering.
   *
   * @see {@link StyleSheet.Options.disableSSR}
   */
  readonly #disableSSR: boolean;

  // Maintains a strong reference to the subscription to retain the subscriber
  #subscription: Subscription.SubscriberRetaining<string>;
  #replacementPromise: Promise<CSSStyleSheet> | undefined;
  #queuedCSSUpdate: CSSString | undefined;

  constructor(options: StyleSheet.Options = {}) {
    super({
      addedRules: [],
      cssObjectHashBySelectorCreator: new Map(),
      includedCSS: [],
      serializedCache: {},
      serializedNamesByRuleName: {},
    });

    this.#document = options.document ?? globalThis.document;
    this.#disableSSR = options.disableSSR ?? false;
    // Maintains a strong reference to the subscription to retain the subscriber
    this.#subscription = this.onCSSChange(this.#handleCSSChange);
  }

  #handleCSSChange = async (css: string) => {
    if (this.#replacementPromise) {
      this.#queuedCSSUpdate = css;
      return;
    }

    try {
      // Update the CSSStyleSheet, if it exists, with the new CSS.
      // The update is performed asynchronously after the initial render.
      this.#replacementPromise = this.#cssStyleSheet?.replace(css);
      await this.#replacementPromise;
    } catch (error) {
      console.error("Error updating CSSStyleSheet:", error);
    } finally {
      this.#replacementPromise = undefined;
    }

    if (this.#queuedCSSUpdate === undefined) return;

    const queuedCSS = this.#queuedCSSUpdate;

    this.#queuedCSSUpdate = undefined;

    this.#handleCSSChange(queuedCSS);
  };

  /**
   * Prefix for serialized names.
   */
  // TODO: Expose this as an option.
  #namePrefix = DEFAULT_NAME_PREFIX;

  readonly addRule: <N extends string>(
    payload: Actions.AddRulePayload<N>,
  ) => void = this.bindActionCreator(Actions.addRule);

  readonly include: (payload: CSSInclude) => void = this.bindActionCreator(
    Actions.include,
  );

  #createSerializedName = (hash: CSSObjectHash): string => {
    return `${this.#namePrefix}-${hash}`;
  };

  /**
   * @internal scope: package
   */
  reduce(
    state: StyleSheetState<CSSRules.ToRuleName<T>>,
    action: AnyAction,
  ): StyleSheetState<CSSRules.ToRuleName<T>> {
    type N = CSSRules.ToRuleName<T>;

    if (Actions.addRule.match(action)) {
      const nextState = { ...state };
      const payload = action.payload;

      nextState.addedRules = [
        ...state.addedRules,
        payload as Actions.AddRulePayload<N>,
      ];

      const { ruleName, selectorCreator, styles } = payload;
      const serialized =
        payload.serialized ?? serializeCSSObject(this.#document, styles);
      const { declarationBlock, hash } = serialized;
      const name = this.#createSerializedName(hash);

      if (!nextState.serializedCache[hash]) {
        nextState.serializedCache = {
          ...state.serializedCache,
          [hash]: declarationBlock,
        };
      }

      nextState.serializedNamesByRuleName = {
        ...state.serializedNamesByRuleName,
        [ruleName]: name,
      };

      nextState.cssObjectHashBySelectorCreator.set(selectorCreator, hash);

      return nextState;
    }

    if (Actions.include.match(action)) {
      const input = action.payload;
      const cssText = cssIncludeToString(input);

      return {
        ...state,
        includedCSS: [...state.includedCSS, cssText],
      };
    }

    return state;
  }

  #getSerializedCSSObject(hash: CSSObjectHash): string | undefined {
    return this.value.serializedCache[hash];
  }

  #isSerializedCSSObjectCached(
    serializedCSSObject: SerializedCSSObject,
  ): boolean {
    return this.#getSerializedCSSObject(serializedCSSObject.hash) !== undefined;
  }

  readonly sx = (styles: StyleObject): SerializedName => {
    const serialized = serializeCSSObject(this.#document, styles);
    const { declarationBlock, hash } = serialized;
    const name = this.#createSerializedName(hash);

    // If the styles are already registered, we don't need to register a new rule.
    // We check if the styles are already registered, because `sx` is typically used
    // for adding rules on the fly during rendering, and we don't want to generate
    // a register a new CSS rule for each render.
    //
    // While, the class name is deterministic based on the styles, so we can reuse the same
    // class name for the same styles, but we need to only register the rule once.
    // Otherwise, the stylesheet would grow indefinitely.
    if (this.#isSerializedCSSObjectCached({ hash, declarationBlock })) {
      return name;
    }

    const ruleName = `${name}-rule`;
    const selectorCreator = createSelectorCreator(ruleName);

    this.addRule({
      ruleName,
      selectorCreator,
      serialized,
      styles,
    });

    return name;
  };

  #selectCSSObjectHashBySelectorCreator = (
    state: StyleSheetState<CSSRules.ToRuleName<T>>,
  ) => {
    return state.cssObjectHashBySelectorCreator;
  };

  #selectSerializedNamesByRuleName = (
    state: StyleSheetState<CSSRules.ToRuleName<T>>,
  ) => {
    return state.serializedNamesByRuleName;
  };

  #selectSerializedCache = (state: StyleSheetState<CSSRules.ToRuleName<T>>) => {
    return state.serializedCache;
  };

  #selectClassNames = (
    state: StyleSheetState<CSSRules.ToRuleName<T>>,
  ): ClassNameDictionary.FromRules<T> => {
    // The type assertion is necessary, because the despite the initial state,
    // being an empty object, `serializedNamesByRuleName` should
    // be a complete dictionary of class names by rule name, by the time the
    // state is consumed.
    //
    // This is not a codified guarantee, but it is a design expectation,
    // that the class names are always complete after a stylesheet is created.
    // TODO: Perhaps we should codify this guarantee by marking stylesheets as "sealed"
    // after they are created.
    return state.serializedNamesByRuleName as ClassNameDictionary.FromRules<T>;
  };

  #selectRulesCSS = createSelector(
    this.#selectSerializedCache,
    this.#selectCSSObjectHashBySelectorCreator,
    this.#selectClassNames,
    (serializedCache, cssObjectHashBySelectorCreator, classNames) => {
      return Array.from(cssObjectHashBySelectorCreator.entries())
        .map(([selectorCreator, hash]) => {
          const selector = selectorCreator(classNames);
          const styles = serializedCache[hash];

          return `${selector} { ${styles} }`;
        })
        .join("\n");
    },
  );

  #selectIncludedCSS(state: StyleSheetState<CSSRules.ToRuleName<T>>): string {
    return state.includedCSS.join("\n");
  }

  #selectCSS = createSelector(
    this.#selectRulesCSS,
    this.#selectIncludedCSS,
    (rulesCSS, includedCSS) => [includedCSS, rulesCSS].join("\n").trim() + "\n",
  );

  /*
   * ### Private Remarks
   *
   * This is conceptually readonly, because the same instance of the `CSSStyleSheet` should be used
   * for the lifetime of the stylesheet. This is because the `CSSStyleSheet` is a live
   * object that is attached to the document, and it should not be replaced.
   *
   * The design decision to support that if the CSS changes, the `CSSStyleSheet` should
   * be updated, is to allow for the stylesheet to be updated in place, without replacing
   * the `CSSStyleSheet` instance.
   */
  #cssStyleSheet: CSSStyleSheet | undefined;

  toCSSStyleSheet(
    CSSStyleSheetConstructor:
      | typeof CSSStyleSheet
      | undefined = globalThis.CSSStyleSheet,
  ): CSSStyleSheet {
    // We lazily create the CSSStyleSheet, because it should only be created
    // when it is needed.
    //
    // This allows for the stylesheet to be created and manipulated without
    // creating a `CSSStyleSheet` instance which may not be used, and may cause
    // unnecessary work and errors.
    //
    // Specifically, `@import` rules may be used
    // in our `Stylesheet`, but a warning will be thrown if the `@import` rule
    // is used in `CSSStyleSheet`.
    //
    // A common use case is to use the `Stylesheet` to generate CSS for @font-face
    // rules that rely on `@import` rules to load the font files, but instead of using
    // `CSSStyleSheet` to apply the rules, the `Stylesheet` is used to generate the CSS
    // which can then be rendered as a `style` element, using the `StyleSheet.style` method.
    if (!this.#cssStyleSheet) {
      if (!CSSStyleSheetConstructor) {
        throw new Error(
          "CSSStyleSheet is not supported in this environment. Please provide a CSSStyleSheet constructor.",
        );
      }

      this.#cssStyleSheet = new CSSStyleSheetConstructor();
      // For the initial render, we synchronously replace the CSS.'
      try {
        this.#cssStyleSheet.replaceSync(this.toCSSString());
      } catch (error) {
        console.error(error);
      }
    }

    return this.#cssStyleSheet;
  }

  /**
   * Subscribe to changes to the CSS.
   */
  readonly onCSSChange = this.createSubscriptionFactory(this.#selectCSS);

  /**
   * A dictionary of class names by rule name.
   *
   * @public
   */
  /*
   * ### Private Remarks
   *
   * This should return an object literal that can be safety enumerated.
   */
  public get classNames(): ClassNameDictionary.FromRules<T> {
    return this.#selectClassNames(this.value);
  }

  toCSSString(): string {
    return this.#selectCSS(this.value);
  }

  toString(): string {
    return this.toCSSString();
  }

  #renderStyleDom(): ElementBuilder.Infer.DOM<"style"> {
    return dom.style.$innerHTML(this.toCSSString());
  }

  #renderStyleHtml(): ElementBuilder.Infer.HTML<"style"> {
    return html.style.$innerHTML(this.toCSSString());
  }

  get style(): {
    (): ElementBuilder.Infer.DOM<"style">;
    html(): ElementBuilder.Infer.HTML<"style">;
  } {
    const style = () => {
      return this.#renderStyleDom();
    };

    style.html = () => {
      return this.#renderStyleHtml();
    };

    return style;
  }

  hostRender(): ElementBuilder.Infer.HTML<"style"> | null {
    return this.#disableSSR ? null : this.#renderStyleHtml();
  }

  extend<T2 extends CSSRules<string>>(
    mixin:
      | StyleSheetMixin<CSSRules.ToRuleName<T> | CSSRules.ToRuleName<T2>>
      | undefined,
    options?: StyleSheet.Options,
  ): StyleSheet<T | T2> {
    type N = CSSRules.ToRuleName<T>;
    type N2 = CSSRules.ToRuleName<T2>;

    if (!mixin) {
      return this as StyleSheet<T | T2>;
    }

    const styleSheet = new StyleSheet<T | T2>(options);
    const addedRules = this.value.addedRules;

    type RuleInputs = [ruleName: N | N2, input: KnytCSSRuleInput<N | N2>][];

    const mixinRules: Actions.AddRulePayload<N | N2>[] = [];

    const entries = Object.entries(mixin) as RuleInputs;

    for (const entry of entries) {
      const [ruleName, input] = entry;
      const payloads = inputToRulePayloads<N | N2>(ruleName, input);

      for (const payload of payloads) {
        mixinRules.push(payload);
      }
    }

    const mergedRules = [];

    for (const addedRule of addedRules) {
      const { ruleName, selectorCreator, styles } = addedRule;

      const matchingMixinRule = mixinRules.find(
        (mixinRule) => mixinRule.ruleName === ruleName,
      );

      if (matchingMixinRule) {
        const { styles: mixinStyles } = matchingMixinRule;

        mergedRules.push({
          ruleName,
          selectorCreator,
          styles: { ...styles, ...mixinStyles },
        });
      } else {
        mergedRules.push(addedRule);
      }
    }
    for (const mixinRule of mixinRules) {
      const { ruleName } = mixinRule;

      if (!addedRules.some((addedRule) => addedRule.ruleName === ruleName)) {
        mergedRules.push(mixinRule);
      }
    }
    for (const rule of mergedRules) {
      styleSheet.addRule(rule);
    }

    return styleSheet;
  }

  clone(options?: StyleSheet.Options): StyleSheet<T> {
    const nextOptions = { document: this.#document, ...options };
    const styleSheet = new StyleSheet<T>(nextOptions);

    for (const rule of this.value.addedRules) {
      styleSheet.addRule(rule);
    }

    return styleSheet;
  }

  #selectAddedRules = (state: StyleSheetState<CSSRules.ToRuleName<T>>) =>
    state.addedRules;

  #selectRuleNames = createSelector(
    this.#selectAddedRules,
    (addedRules): CSSRules.ToRuleName<T>[] =>
      addedRules.map((rule) => rule.ruleName),
  );

  /**
   * Generates a hash of the CSS.
   * This is used to compare stylesheets for equality.
   *
   * @example "BgT¸¢\u001cØ@ôÂ»™_ê®û\u001e``ÿÇ•2·ÚÐ w×>V"
   */
  #selectHash = createSelector(
    this.#selectRuleNames,
    this.#selectCSS,
    (ruleNames, css): string => {
      const input = `${ruleNames}${css}`;

      return new TextDecoder("latin1").decode(sha256(input));
    },
  );

  get hash(): string {
    return this.#selectHash(this.value);
  }

  equals(other: StyleSheet<T> | undefined): boolean {
    if (!other) return false;

    return this === other || this.hash === other.hash;
  }

  /**
   * Adds the style sheet to the document or shadow root
   * if it isn't already added.
   */
  addTo(documentOrShadow: DocumentOrShadowRoot): void {
    const cssStyleSheet = this.toCSSStyleSheet(
      getCSSStyleSheetConstructor(documentOrShadow),
    );

    if (!documentOrShadow.adoptedStyleSheets.includes(cssStyleSheet)) {
      documentOrShadow.adoptedStyleSheets.push(cssStyleSheet);
    }
  }

  /**
   * Removes the first instance of the style sheet from the document or shadow root.
   */
  removeFrom(documentOrShadow: DocumentOrShadowRoot): void {
    const cssStyleSheet = this.toCSSStyleSheet(
      getCSSStyleSheetConstructor(documentOrShadow),
    );

    const indexToRemove =
      documentOrShadow.adoptedStyleSheets.indexOf(cssStyleSheet);

    if (indexToRemove === -1) return;

    documentOrShadow.adoptedStyleSheets =
      documentOrShadow.adoptedStyleSheets.toSpliced(indexToRemove, 1);
  }
}

export namespace StyleSheet {
  export type ToRules<T extends StyleSheet<any>> =
    T extends StyleSheet<infer U> ? U : never;

  export type Options = {
    /**
     * The document to use for rendering.
     * If not provided, the current document will be used.
     *
     * @remarks
     *
     * This is useful for containing the rendered elements in a specific document,
     * such as when server-side rendering.
     */
    document?: Document;
    /**
     * Prevents server-side rendering of the stylesheet.
     *
     * @remarks
     *
     * If true, the stylesheet's `hostRender` method will return `null` instead of
     * a `style` element declaration.
     *
     * @see {@link StyleSheet.hostRender}
     */
    disableSSR?: boolean;
  };

  export type Rules<N extends string = string> = CSSRules<N>;
}

/**
 * Checks if the given value is a `StyleSheet` using duck typing.
 *
 * @remarks
 *
 * This is useful for checking if a value is a `StyleSheet` without
 * using `instanceof`, which would prevent multiple versions of the
 * `StyleSheet` class from being used in the same project.
 */
export function isStyleSheet<T extends CSSRules<string> = any>(
  value: unknown,
): value is StyleSheet<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "sx" in value &&
    typeof (value as StyleSheet<T>).sx == "function" &&
    "toCSSStyleSheet" in value &&
    typeof (value as StyleSheet<T>).toCSSStyleSheet == "function" &&
    "onCSSChange" in value &&
    typeof (value as StyleSheet<T>).onCSSChange == "function"
  );
}

// TODO: Migrate this to `Store.createActions()`
namespace Actions {
  const createAction = actionCreatorFactory("StyleSheet");

  export type AddRulePayload<N extends string> = {
    ruleName: N;
    selectorCreator: SelectorCreator<N>;
    serialized?: SerializedCSSObject;
    styles: StyleObject;
  };

  export const addRule = createAction<AddRulePayload<string>>("addRule");

  export const include = createAction<CSSInclude>("include");
}
