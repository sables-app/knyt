import type {
  AnyProps,
  AttributeDictionary,
  HTMLElementTagName,
} from "@knyt/weaver";

import type { KnytElement } from "../KnytElement.ts";
import type {
  ElementDefinition,
  HTMLElementConstructor,
  PropertiesDefinition,
} from "../types.ts";
import {
  defineElementDefinition,
  type DefineElementDefinitionOptions,
} from "./defineElementDefinition.ts";
import {
  defineKnytElement,
  type DefineElementOptions,
} from "./defineKnytElement.ts";

/**
 * Creates a custom element with the given tagname and options.
 *
 * This is a shorthand function for defining a custom element without having
 * to use the class interface.
 *
 * @param tagName The name of the custom element.
 * @param options The options for the custom element.
 * @returns A element definition for the custom element.
 *
 * @public
 */
export function defineElement<TN extends string, PropInfoDict>(
  tagName: TN,
  options: Omit<DefineElementOptions<TN, PropInfoDict>, "tagName">,
): ElementDefinition.FromPropertiesDefinition<
  TN,
  PropertiesDefinition<PropInfoDict>
>;

/**
 * Creates a custom element with the given options.
 *
 * This is a shorthand function for defining a custom element without having
 * to use the class interface.
 *
 * @param options The options for the custom element.
 * @returns A element definition for the custom element.
 *
 * @public
 *
 * @deprecated
 */
export function defineElement<TN extends string, PropInfoDict>(
  options: DefineElementOptions<TN, PropInfoDict>,
): ElementDefinition.FromPropertiesDefinition<
  TN,
  PropertiesDefinition<PropInfoDict>
>;

/**
 * Defines a custom element with the given tagname and constructor.
 *
 * @param tagName The name of the custom element.
 * @param ElementConstructor The constructor of the custom element.
 * @returns A element definition for the custom element.
 *
 * @public
 */
export function defineElement<
  T extends KnytElement.Constructor.Any,
  U extends HTMLElementTagName.Input,
  P extends AnyProps = InstanceType<T>,
  A extends AnyProps = KnytElement.ToAttributes<T>,
>(
  tagName: U,
  ElementConstructor: T,
  options?: DefineElementDefinitionOptions,
): ElementDefinition<T, U, P, A>;

/**
 * Defines a custom element with the given tagname and constructor.
 *
 * This overload is for non-KnytElement constructors (arbitrary elements).
 *
 * @param tagName The name of the custom element.
 * @param ElementConstructor The constructor of the custom element.
 * @param options Additional options for defining the element.
 * @returns A element definition for the custom element.
 *
 * @public
 */
export function defineElement<
  T extends HTMLElementConstructor,
  U extends HTMLElementTagName.Input,
  P extends AnyProps = InstanceType<T>,
  A extends AnyProps = AttributeDictionary,
>(
  tagName: U,
  ElementConstructor: T,
  options?: DefineElementDefinitionOptions,
): ElementDefinition.Arbitrary<T, U, P, A>;

/*
 * ### Private Remarks
 *
 * This function is a wrapper around `defineKnytElement` and `defineElementDefinition`.
 *
 * It allows defining elements in a more flexible way, either by providing
 * a tag name and options, or by providing a full `DefineElementOptions` object.
 *
 * It's exposed on the `define` namespace as `define.element`.
 */
export function defineElement(
  arg0: string | DefineElementOptions<string, unknown>,
  arg1?:
    | KnytElement.Constructor.Any
    | Omit<DefineElementOptions<string, unknown>, "tagName">,
  arg2?: DefineElementDefinitionOptions,
): any {
  if (typeof arg0 === "object") {
    return defineKnytElement(arg0);
  }
  if (!arg1) {
    throw new Error("Element constructor or options must be provided.");
  }
  if ("lifecycle" in arg1) {
    return defineKnytElement({ ...arg1, tagName: arg0 });
  }

  return defineElementDefinition(arg0, arg1, arg2);
}
