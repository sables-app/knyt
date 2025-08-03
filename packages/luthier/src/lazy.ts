import {
  createDOMBuilder,
  createHTMLBuilder,
  type AnyProps,
  type AttributeDictionary,
  type HTMLElementTagName,
} from "@knyt/weaver";

import type { ElementDefinition } from "./types";
import type { KnytElement } from "./KnytElement";

/**
 * @public
 */
/*
 * ### Private Remarks
 *
 * The definition of a lazy element. Due to the nature of lazy elements, the
 * `Element` property is not immediately available. Instead, the `Element`
 * property is only available after the element has been imported.
 */
export type LazyElementDefinition<
  T extends KnytElement.Constructor.Unknown,
  U extends string,
  P extends AnyProps = InstanceType<T>,
  A extends AttributeDictionary = KnytElement.ToAttributes<T>,
> = ElementDefinition.Fn<P> &
  Omit<ElementDefinition.Static<T, U, A>, "Element"> & {
    /**
     * @returns A promise that resolves to the constructor of the custom element.
     */
    readonly Element: () => Promise<T>;
  };

/**
 *
 * @param tagName
 * @param importer
 * @returns
 */
export function lazy<
  T extends KnytElement.Constructor.Unknown,
  U extends HTMLElementTagName,
>(
  tagName: U,
  importer: () => Promise<{ default: ElementDefinition<T, U> }>,
): LazyElementDefinition<T, U> {
  const domBuilder = createDOMBuilder<InstanceType<T>>(tagName);
  const htmlBuilder = createHTMLBuilder<KnytElement.ToAttributes<T>>(tagName);

  let importerCalled = false;

  function importElement() {
    if (!importerCalled) {
      importerCalled = true;
      importer();
    }
  }

  const lazyElementDefinition = () => {
    importElement();

    return domBuilder;
  };

  lazyElementDefinition.html = () => {
    importElement();

    return htmlBuilder;
  };

  lazyElementDefinition.tagName = tagName;

  lazyElementDefinition.Element = (): Promise<T> => {
    return importer().then((module) => module.default.Element);
  };

  lazyElementDefinition.__isKnytElementDefinition = true as const;

  return lazyElementDefinition;
}
