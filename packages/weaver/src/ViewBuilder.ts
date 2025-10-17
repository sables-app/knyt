import {
  ViewBuilderIsViewSymbol,
  ViewBuilderTargetSymbol,
  ViewSymbol,
} from "./constants.ts";
import type {
  AnyProps,
  ElementBuilder,
  EnforceOptionalAndCompleteObject,
  UnknownProps,
  View,
  ViewBuilder,
  ViewBuilderFactory,
  ViewDeclaration,
} from "./types/mod.ts";
import {
  cloneView,
  createEmptyView,
  getMutableViewDeclarationFromViewBuilder,
  isElementBuilderChildren,
  isElementDeclarationKeyInput,
  isElementDeclarationPropsInput,
  isElementDeclarationRefInput,
  isViewDeclaration,
} from "./utils/mod.ts";

enum SpecialProperties {
  Children = "$children",
  ChildrenShorthand = "$",
  Key = "$key",
  Props = "$props",
  Ref = "$ref",
  /**
   * A blocked property to prevent the proxy from being
   * resolved like a promise.
   *
   * @remarks
   *
   * This is used to prevent the proxy being recognized
   * as a `PromiseLike` object, which would cause the `then`
   * method to be called, and the resulting "promise" is
   * never resolved.
   */
  Then = "then",
}

function createViewBuilderFactory<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
>(): ViewBuilderFactory<P, E> {
  function viewBuilderFactory(
    input: View.RenderFn<P, E> | ViewDeclaration<P, E>,
  ): ViewBuilder<P, E> {
    let target: ViewDeclaration<P, E>;

    if (isViewDeclaration<ViewDeclaration<P, E>>(input)) {
      target = cloneView<P, E>(input);
    } else {
      target = createEmptyView<P, E>(input);
    }

    const viewBuilder = new Proxy(
      {},
      {
        get: (_fakeTarget, propertyName, _receiver) => {
          if (propertyName === ViewBuilderTargetSymbol) {
            return target;
          }
          if (propertyName === ViewBuilderIsViewSymbol) {
            return true;
          }
          if (propertyName === SpecialProperties.Then) {
            // This is a blocked property to prevent the proxy from being
            // resolved like a promise.
            return undefined;
          }

          return (...args: unknown[]) => {
            const [value, ..._rest] = args;
            const rest = _rest as ElementBuilder.Child[];

            /**
             * This is the next element builder that will be returned.
             */
            // TODO: Refactor to use `handoffToElementBuilder` instead.
            const nextViewBuilder = viewBuilderFactory(target);
            /**
             * This is the next element declaration from the next element builder.
             * This object can be safely mutated with the requested changes,
             * before returning the next element builder.
             */
            // TODO: Refactor to use `handoffToElementBuilder` instead.
            const nextView =
              getMutableViewDeclarationFromViewBuilder(nextViewBuilder);

            if (
              propertyName === SpecialProperties.Children ||
              propertyName === SpecialProperties.ChildrenShorthand
            ) {
              const firstChild = value == null ? [] : [value];
              const children = [...firstChild, ...rest];

              if (!isElementBuilderChildren(children)) {
                throw new Error("Invalid child type");
              }

              nextView.children = children;
            } else if (propertyName === SpecialProperties.Ref) {
              if (!isElementDeclarationRefInput<E>(value)) {
                throw new Error("Invalid ref type");
              }

              nextView.ref = value;
            } else if (propertyName === SpecialProperties.Key) {
              if (!isElementDeclarationKeyInput(value)) {
                throw new Error(`Invalid key type: ${typeof value}`);
              }

              nextView.key = value;
            } else if (propertyName === SpecialProperties.Props) {
              if (!isElementDeclarationPropsInput(value)) {
                throw new Error(`Invalid props value type: ${typeof value}`);
              }

              Object.assign(nextView.props, value);
            } else {
              (nextView.props as UnknownProps)[propertyName] = value;
            }

            return nextViewBuilder;
          };
        },
      },
    );

    // Type assertion is needed because of the Proxy
    return viewBuilder as unknown as ViewBuilder<P, E>;
  }

  return viewBuilderFactory;
}

function createViewBuilder<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
>(render: View.RenderFn<P, E>): ViewBuilder<P, E> {
  return createViewBuilderFactory<P, E>()(render);
}

type EnforcePartialProps<T> = EnforceOptionalAndCompleteObject<
  T,
  {
    KnytError: "🚨 All props must be optional.";
  }
>;

/**
 * Defines a view with the given render function.
 */
export function defineView<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
>(
  render: View.RenderFn<EnforcePartialProps<P>, E>,
  _options?: View.Options,
): View<EnforcePartialProps<P>, E> {
  const view = (): ViewBuilder<P, E> => {
    return createViewBuilder<P, E>(
      // Type assertion is needed because of enforcing the partial object type.
      render as View.RenderFn<P, E>,
    );
  };

  view[ViewSymbol] = true as const;

  // Type assertion is needed, because of the the use of `EnforcePartialProps<P>`.
  return view as View<EnforcePartialProps<P>, E>;
}

export function isView(value: unknown): value is View<AnyProps, AnyProps> {
  return (
    typeof value === "function" &&
    ViewSymbol in value &&
    (value as View)[ViewSymbol] === true
  );
}
