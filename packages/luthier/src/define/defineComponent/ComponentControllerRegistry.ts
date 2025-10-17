import { combineSubscribers } from "@knyt/artisan";
import type { StyleSheet } from "@knyt/tailor";
import {
  type AnyProps,
  type ElementBuilder,
  type KnytDeclaration,
  type View,
} from "@knyt/weaver";

import type { PropertiesDefinition } from "../../types.ts";
import type { Component } from "./Component.ts";
import { ComponentController } from "./ComponentController.ts";

class ComponentControllerRegistry {
  #controllers = new WeakMap<Element, ComponentController<any, any>>();

  #getController<P extends AnyProps, E extends Element>(
    element: E,
    options: ComponentController.Options<P, E>,
  ): ComponentController<P, E> {
    const existingController = this.#controllers.get(element);

    if (existingController) {
      return existingController as unknown as ComponentController<P, E>;
    }

    const newController = new ComponentController<P, E>(options);

    this.#controllers.set(
      element,
      newController as unknown as ComponentController<any, any>,
    );

    return newController;
  }

  #createRootElementReferenceFactory<P extends AnyProps, E extends Element>(
    options: ComponentController.Options<P, E>,
  ) {
    return ({ props, children }: { props: P; children?: KnytDeclaration }) => {
      return (el: E | null) => {
        // We don't need to handle previous roots, because the controller
        // will clean itself up when the root element is removed.
        //
        // We don't want to assume if the renderer discards the previous root
        // element or not, so we'll leave the controller to clean itself up.

        if (!el) return;

        const controller = this.#getController<P, E>(el, options);

        controller.root$.set(el);
        controller.latestChildren$.set(children);
        controller.setProps(props);
      };
    };
  }

  /**
   * Extracts the element props from the component props.
   */
  #splitProps<PD extends PropertiesDefinition<any>, E extends Element>(
    properties: PD,
    props: Component.Props<PD, E>,
  ): {
    reactivePropValues: Component.Props<PD, E>;
    elementPropValues: Partial<E>;
  } {
    const reactivePropValues: Record<string, any> = {};
    const elementPropValues: Record<string, any> = {};

    for (const key in props) {
      if (key in properties) {
        reactivePropValues[key] = props[key];
      } else {
        elementPropValues[key] = props[key];
      }
    }

    return {
      reactivePropValues,
      elementPropValues,
    } as any;
  }

  /**
   * @internal scope: package
   */
  createViewRenderer<PD extends PropertiesDefinition<any>, E extends Element>(
    options: ComponentOptions<PD, E>,
  ): View.RenderFn<Component.Props<PD, E>, E> {
    const controllerRootReferenceFactory =
      this.#createRootElementReferenceFactory(options);
    const renderView: View.RenderFn<Component.Props<PD, E>, E> = (
      allProps,
      { children, ref: externalRoot$, key },
    ): KnytDeclaration => {
      const { reactivePropValues, elementPropValues } = this.#splitProps<PD, E>(
        options.properties,
        allProps,
      );
      const controllerRoot$ = controllerRootReferenceFactory({
        props: reactivePropValues,
        children,
      });
      const rootBuilder = options.root;
      const root$ = combineSubscribers(
        externalRoot$,
        controllerRoot$,
      ) as ElementBuilder.Ref<E>;

      return (
        rootBuilder
          .$renderMode("opaque")
          .$ref(root$)
          .$key(key)
          .$props(
            // Type cast to ignore an unhelpful type error.
            // It's not worth the effort to fix this,
            // because the type for `elementPropValues` is correct.
            elementPropValues as any,
          )
          // Remove all children from the root element builder,
          // because the children are rendered separately.
          // This is an opaque element, so it shouldn't have
          // any children.
          .$children()
      );
    };

    return renderView;
  }
}

export type ComponentOptions<
  PD extends PropertiesDefinition<any>,
  E extends Element,
> = {
  debug?: boolean;
  /**
   * @alpha
   */
  styleSheet?: StyleSheet<any>;
  // TODO: Make this optional.
  properties: PD;
  /*
   * ### Private Remarks
   *
   * Originally, this property could be either an `ElementBuilder`
   * or be a function that returns an `ElementBuilder`. However,
   * this was removed because it was causing type inference issues.
   *
   * Additionally, the function was not necessary, because it lends
   * itself to code-smell. The root element is supposed to mimic the
   * behavior of a custom element host. As such, it shouldn't
   * need to be reactive to props.
   *
   * For example, if you want to set a class name on the root
   * element, the consumer should be setting the class name
   * on the component. The component shouldn't be setting
   * the class name on itself.
   */
  root: Component.RootInput<E>;
  /**
   * Defines the lifecycle of the element.
   *
   * @param _host TODO: Remove this parameter.
   * @returns Returns a function that renders the element.
   */
  lifecycle: Component.LifecycleFn<Component.Props<PD, E>, E>;
};

/**
 * @internal scope: package
 *
 * This is a singleton; however, each controller is associated with
 * a unique element, and the registry relies on a WeakMap to manage
 * the controllers. As a result, the registry does not prevent
 * controllers from being garbage collected when their associated
 * elements are removed from the DOM.
 */
export const globalComponentRegistry = new ComponentControllerRegistry();
