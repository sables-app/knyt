import { css, type StyleSheet } from "@knyt/tailor";
import type { HTMLElementTagName } from "@knyt/weaver";

import {
  __isKnytElementComposed,
  __knytElementComposedLifecycle,
  __knytElementComposedRenderer,
} from "../constants";
import { getConstructorStaticMember } from "../getConstructorStaticMember";
import {
  isContainerModeEnabled,
  KnytElement,
  type KnytElementOptions,
} from "../KnytElement";
import type {
  KnytElementComposed,
  LifecycleFn,
  RendererFn,
} from "../KnytElementComposed";
import type { ElementDefinition, PropertiesDefinition } from "../types";
import {
  defineElementDefinition,
  type DefineElementDefinitionOptions,
} from "./defineElementDefinition";

/**
 * @internal scope: package
 */
export type DefineElementOptions<
  // NOTE: We could make this type stricter by using something like `${string}-${string}` or similar,
  // but it's not worth the extra complexity. Both the library and consumers would have to pass around the
  // custom type, and it would not provide much benefit.
  TN extends string,
  PropInfoDict,
> = {
  /*
   * ### Private Remarks
   *
   * It was decided to use `tagName` instead of `name` for clarity,
   * because `name` is a common property name, and it's ambiguous
   * in this context. Also, Vue uses `name` for the component name,
   * so it's better to avoid confusion; i.e. this is an element not
   * a component.
   */
  tagName: TN;
  /**
   * Defines the static style sheet for the element.
   */
  /*
   * ### Private Remarks
   *
   * The style sheet can also be set to `null` to disable the default style sheet.
   * This is useful for elements that do not require any styling.
   * Web browsers style custom elements as `display: inline` by default.
   */
  styleSheet?: KnytElement.StaticStyleSheet | null;
  properties?: PropertiesDefinition<PropInfoDict>;
  /**
   * Defines the lifecycle of the element.
   *
   * @param _host TODO: Remove this parameter.
   * @returns Returns a function that renders the element.
   */
  lifecycle: LifecycleFn<PropertiesDefinition<PropInfoDict>>;
  options?: KnytElementOptions &
    // Omit `defaultRenderMode` from the options, because `KnytElementOptions.renderMode` is used instead.
    Omit<DefineElementDefinitionOptions, "defaultRenderMode">;
};

/**
 * Composes and defines a new `KnytElement` custom element.
 *
 * @internal scope: package
 */
// TODO: Update parameters to start with `tagName` like:
// `defineKnytElement(tagName, options);`
// TODO: Rename to something like `defineComposedElement`
/*
 * ### Private Remarks
 *
 * Despite the return types, this function returns a `KnytElementComposed` constructor.
 */
export function defineKnytElement<TN extends string, PropInfoDict>(
  params: DefineElementOptions<TN, PropInfoDict>,
): ElementDefinition.FromPropertiesDefinition<
  TN,
  PropertiesDefinition<PropInfoDict>
> {
  const ElementConstructor = class extends KnytElement {
    static readonly [__isKnytElementComposed] = true as const;
    static [__knytElementComposedLifecycle] = params.lifecycle;

    [__knytElementComposedRenderer]: RendererFn<
      PropertiesDefinition<PropInfoDict>
    >;

    constructor() {
      super(params.options);

      const host = this as unknown as KnytElement.FromPropertiesDefinition<
        PropertiesDefinition<PropInfoDict>
      >;

      const lifecycle = getConstructorStaticMember(
        this,
        __knytElementComposedLifecycle,
      ) as LifecycleFn<PropertiesDefinition<PropInfoDict>>;

      this[__knytElementComposedRenderer] =
        lifecycle.call(host, host) ?? (() => null);
    }

    render() {
      const host = this as unknown as KnytElement.FromPropertiesDefinition<
        PropertiesDefinition<PropInfoDict>
      >;
      const renderer = this[__knytElementComposedRenderer];

      return renderer.call(host, host);
    }
    // Use `satisfies to ensure the class has the correct static members.
    // Then use type casting to get the correct constructor type.
  } satisfies KnytElementComposed.ConstructorStaticMembers as unknown as KnytElement.Constructor.FromPropertiesDefinition<
    PropertiesDefinition<PropInfoDict>
  >;

  ElementConstructor.properties =
    params.properties ?? ({} as PropertiesDefinition<PropInfoDict>);

  ElementConstructor.styleSheet = getStyleSheet(params);

  const { renderMode, customElements } = params.options ?? {};

  const definition = defineElementDefinition(
    params.tagName as HTMLElementTagName,
    ElementConstructor,
    {
      defaultRenderMode: renderMode,
      customElements,
    },
  ) as ElementDefinition.FromPropertiesDefinition<
    TN,
    PropertiesDefinition<PropInfoDict>
  >;

  return definition;
}

/**
 *  Retrieves the style sheet for a Knyt element based on the provided parameters.
 */
function getStyleSheet<TN extends string, PropInfoDict>(
  params: DefineElementOptions<TN, PropInfoDict>,
): KnytElement.StaticStyleSheet {
  const { options, styleSheet, tagName } = params;

  // If a styleSheet is provided, return it directly.
  // Do not check for the existence of `styleSheet` in the options object,
  // as users may intentionally set `styleSheet` to `undefined` to disable
  // the default style sheet. This approach allows users to either supply
  // a custom style sheet or explicitly opt out of the default styling
  // by passing `undefined`. If a custom style sheet is desired, it can
  // be provided directly via the options.
  if ("styleSheet" in params) {
    return styleSheet ?? undefined;
  }

  if (isContainerModeEnabled(options ?? {})) {
    return createContainerDefaultStyleSheet(tagName);
  }

  return undefined;
}

/**
 * Creates a default style sheet for a container element.
 *
 * @remarks
 *
 * This style sheet sets the display property to "contents", which allows the
 * container to act as a transparent wrapper for its children, without adding
 * any additional layout or styling.
 */
function createContainerDefaultStyleSheet(
  tagName: string,
): StyleSheet<{ container: any }> {
  return css({
    container: {
      selector: tagName,
      styles: {
        display: "contents",
      },
    },
  });
}
