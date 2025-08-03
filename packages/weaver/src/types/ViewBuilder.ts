import type { Observable, OptionalAndComplete } from "@knyt/artisan";

import type {
  ViewBuilderIsViewSymbol,
  ViewBuilderTargetSymbol,
  ViewDeclarationSymbol,
  ViewSymbol,
} from "../constants";
import type {
  AnyProps,
  ElementDeclaration,
  KnytDeclaration,
  RenderResult,
} from "./core";
import type { ElementBuilder } from "./ElementBuilder";

export type ViewDeclaration<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
> = {
  [ViewDeclarationSymbol]: true;
  props: P;
  children: ElementDeclaration.Child[];
  ref: ElementDeclaration.Ref<E> | undefined;
  key: string | undefined;
  render: View.RenderFn<P, E>;
};

export namespace ViewDeclaration {
  export type Input = ViewDeclaration<any, any>;
}

/**
 * Enforces that the given type is a Partial object.
 */
export type EnforceOptionalAndCompleteObject<
  T,
  U = EnforceOptionalAndCompleteObject.MessageObject,
> = OptionalAndComplete<T> extends T ? T : U;

export namespace EnforceOptionalAndCompleteObject {
  export type MessageObject = {
    // Use an object with a custom error message to provide more context
    // about the error. This approach is more informative than using `never`,
    // as it helps identify the issue more clearly. This serves as a workaround
    // for TypeScript's limitation in providing custom error messages/annotations
    // for type errors.
    KnytError: "🚨 Expected a Partial object";
  };
}

export type View<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
> = (() => ViewBuilder<P, E>) & {
  /** @internal scope: workspace */
  readonly [ViewSymbol]: true;
};

export namespace View {
  /**
   * A function that returns a `ViewBuilder`.
   *
   * @remarks
   *
   * Currently, an alias for the `View` type.
   *
   * @alpha
   */
  /*
   * ### Private Remarks
   *
   * This type exists to maintain consistency with the `ElementDefinition` type.
   * It is not intended for public use yet. `View` doesn't have static
   * properties yet, but it may in the future, so this type is here to
   * accommodate that.
   */
  export type Fn<
    P extends AnyProps = AnyProps,
    E extends AnyProps = Element,
  > = View<P, E>;

  export type RenderFn<
    P extends AnyProps = AnyProps,
    E extends AnyProps = Element,
  > = (props: P, payload: RendererPayload<E>) => RenderResult;

  export type RendererPayload<E extends AnyProps = Element> = {
    children?: KnytDeclaration;
    ref?: Observable.Subscriber<E | null>;
    key?: string;
  };

  export type Options = {
    // Currently unused, but kept for future use.
    // TODO: Implement debug logging.
    debug?: boolean;
  };
}

export type ViewBuilder<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
> = ViewBuilder.ViewMutators<P, E> &
  ViewBuilder.CommonMutators<P, E> &
  ViewBuilder.BatchMutators<P, E>;

export type ViewBuilderFactory<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
> = (render: View.RenderFn<P, E>) => ViewBuilder<P, E>;

export namespace ViewBuilder {
  /**
   * A type representing a view builder with generics that have yet to be determined.
   *
   * @remarks
   *
   * This type should only be used for inputs.
   * Usage of `any` is intentional here, because where this type would be used,
   * the generic types are not yet determined.
   */
  export type Input = ViewBuilder<any, any>;

  /**
   * @internal scope: workspace
   */
  export type ViewMutators<
    P extends AnyProps = AnyProps,
    E extends AnyProps = Element,
  > = {
    [K in keyof P as K]-?: (value: P[K]) => ViewBuilder<P, E>;
  };

  /**
   * @internal scope: workspace
   */
  export type CommonMutators<
    P extends AnyProps = AnyProps,
    E extends AnyProps = Element,
  > = {
    /**
     * Declare the children of the element.
     */
    $children: (...children: ElementBuilder.ChildrenInput) => ViewBuilder<P, E>;
    /**
     * A shorthand for `$children`.
     *
     * @see ViewBuilder.$children
     *
     * @alpha
     */
    $: (...children: ElementBuilder.ChildrenInput) => ViewBuilder<P, E>;
    /**
     * Provides access to the underlying DOM element when rendered in the DOM.
     *
     * @remarks
     *
     * Useful for direct DOM operations such as setting focus or measuring the element.
     * The ref is not called when rendered using the `render` function.
     */
    $ref: (ref?: ElementBuilder.Ref<E>) => ViewBuilder<P, E>;
    /**
     * Set an optional key for the element.
     *
     * @remarks
     *
     * This is necessary when rendering a list of elements.
     * Or when you need to uniquely identify an element.
     * Changing the key will cause the respective element to be reconstructed.
     */
    $key: (key: string | undefined) => ViewBuilder<P, E>;
    /**
     * This is a blocked property to prevent the proxy from being
     * resolved as a Promise-Like object.
     */
    // TODO: Consider removing this. It's accurate to be blocked, but
    // it appears in intellisense and may be confusing.
    // then: never;
  };

  /**
   * @internal scope: workspace
   */
  export type BatchMutators<
    P extends AnyProps = AnyProps,
    E extends AnyProps = P,
  > = {
    /**
     * Set the properties of the DOM element.
     */
    $props: (input: P) => ViewBuilder<P, E>;

    // ViewBuilder's do accept attributes. They only don't accept properties
    // that are supported by View. The template may use the property
    // values as attributes, but it's up to the template to decide.
    // $attrs: never;
  };

  export type ToProps<T extends ViewBuilder> =
    T extends ViewBuilder<infer P, any> ? P : never;

  export type ToNode<T extends ViewBuilder> =
    T extends ViewBuilder<any, infer E> ? E : never;

  /**
   * @internal scope: workspace
   */
  export type Private<P extends AnyProps = AnyProps, E extends AnyProps = P> = {
    /**
     * @internal scope: workspace
     */
    [ViewBuilderIsViewSymbol]: true;
    /**
     * @internal scope: workspace
     */
    [ViewBuilderTargetSymbol]: ViewDeclaration<P, E>;
  };
}
