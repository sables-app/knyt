import {
  combineSubscribers,
  type Observable,
  type Reference,
} from "@knyt/artisan";

import { build } from "./build/mod";
import { dom } from "./ElementBuilder";
import type {
  AnyProps,
  ElementBuilder,
  KnytDeclaration,
  RenderResult,
  UpdatableParentNode,
} from "./types/mod";
import { removeAllChildren, update } from "./update/mod";
import { normalizeRenderResult } from "./utils/mod";

type RenderFn<State extends object, Auxiliary> = (
  state: State,
  auxiliary: Auxiliary,
) => KnytDeclaration;

type LifecycleFn<State extends object, Auxiliary> = (
  state$: Reference.Readonly<State>,
) => RenderFn<State, Auxiliary>;

type Root<E extends AnyProps, Auxiliary> = {
  /**
   * The element that serves as the root of the render tree.
   * This element is updated when the state changes.
   */
  element: WeakRef<E>;
  /**
   * Supplementary data that is passed to the render function.
   * Updates are not triggered when this data changes.
   */
  auxiliary: Auxiliary;
};

export class RenderController<
  State extends object,
  Auxiliary,
  T extends ElementBuilder.DOM<any, UpdatableParentNode>,
> {
  get rootBuilder(): T {
    throw new Error("Property not implemented.");
  }

  readonly #state$: WeakRef<Reference.Readonly<State>>;

  readonly #roots = new Array<Root<ElementBuilder.ToNode<T>, Auxiliary>>();

  /**
   * Removes roots that have been reclaimed by the garbage collector.
   */
  #removeReclaimedRoots(): void {
    for (let i = 0; i < this.#roots.length; i++) {
      const root = this.#roots[i].element.deref();

      if (!root) {
        this.#roots.splice(i, 1);
        i--;
      }
    }
  }

  #getRootByElement(
    element: ElementBuilder.ToNode<T>,
  ): Root<ElementBuilder.ToNode<T>, Auxiliary> | undefined {
    for (const root of this.#roots) {
      if (root.element.deref() === element) {
        return root;
      }
    }

    this.#removeReclaimedRoots();

    return undefined;
  }

  createRootSubscriber(auxiliary: Auxiliary) {
    return (element: ElementBuilder.ToNode<T> | null) => {
      if (!element) return;

      const existingRoot = this.#getRootByElement(element);

      if (existingRoot) {
        // Update the auxiliary data, but don't update the element.
        // The element should only be updated when the state changes.
        existingRoot.auxiliary = auxiliary;
        return;
      }

      this.#roots.push({
        element: new WeakRef(element),
        auxiliary,
      });

      // All side-effects are run asynchronously
      queueMicrotask(() => {
        // Immediately update the root element with the current state
        // when a new root is added.
        this.insertRoot(element, auxiliary);
      });
    };
  }

  constructor(state$: Reference.Readonly<State>) {
    this.#state$ = new WeakRef(state$);

    state$.subscribe(this);
  }

  render(state: State, auxiliary: Auxiliary): RenderResult {
    return dom.fragment;
  }

  next(_state: State) {
    this.updateAllRoots();
  }

  async updateAllRoots(): Promise<void> {
    const state = this.#state$.deref()?.value;

    if (!state) return;

    // We're using `forEach` here, because we want don't want to
    // wait for the updates to finish before continuing.
    this.#roots.forEach(async (root) => {
      const rootElement = root.element.deref();

      if (rootElement) {
        await update(
          rootElement,
          await normalizeRenderResult(this.render(state, root.auxiliary)),
        );
      }
    });

    this.#removeReclaimedRoots();
  }

  async insertRoot(
    rootElement: ElementBuilder.ToNode<T>,
    auxiliary: Auxiliary,
  ) {
    const state = this.#state$.deref()?.value;

    if (!state) return;

    const contentsDeclaration = await normalizeRenderResult(
      this.render(state, auxiliary),
    );
    const contents = (await build(contentsDeclaration)) as Node | null;

    if (!contents) return;

    removeAllChildren(rootElement);
    rootElement.appendChild(contents);
  }

  static readonly instances = new WeakMap<
    Reference.Readonly<any>,
    RenderController<any, any, any>
  >();

  static getInstance<T extends RenderController<any, any, any>>(
    state$: Reference.Readonly<RenderController.ToState<T>>,
  ): RenderController<
    RenderController.ToState<T>,
    RenderController.ToOptions<T>,
    RenderController.ToElementBuilder<T>
  > {
    let instance = this.instances.get(state$);

    if (!instance) {
      instance = new this(state$);

      this.instances.set(state$, instance);
    }

    return instance;
  }

  static declareRoot<
    T extends RenderController.Constructor,
  >(): RenderController.DeclaredRoot<T> {
    return {
      // TODO: Consider adding support for `children` here.
      $init: ({ state, auxiliary, ref }) => {
        const externalRoot$ = ref;
        const controller = this.getInstance(state);
        const controllerRoot$ = controller.createRootSubscriber(auxiliary);
        const root$ = combineSubscribers(externalRoot$, controllerRoot$);

        let rootBuilder = controller.rootBuilder;

        // NOTE: For some reason TypeScript doesn't infer the type of `rootBuilder`
        // correctly, and all of its methods end up being `any`. I've verified that
        // the types are correct. As a result, we have to cast it to `ElementBuilder`
        // to get some type safety back.
        //
        // it seems like the TypeScript compiler is reaching the limit of its type
        // inference, and it stops. Hopefully, this will go away when the Go-based
        // compiler is released.
        //
        // prettier-ignore
        rootBuilder = (rootBuilder as ElementBuilder).$renderMode("opaque") as typeof rootBuilder;
        // prettier-ignore
        rootBuilder = (rootBuilder as ElementBuilder).$ref(root$ as ElementBuilder.Ref<AnyProps>) as typeof rootBuilder;

        return rootBuilder;
      },
    };
  }
}

export namespace RenderController {
  export type ToState<T> =
    T extends RenderController<infer S, any, any> ? S : never;

  export type ToOptions<T> =
    T extends RenderController<any, infer O, any> ? O : never;

  export type ToElementBuilder<T> =
    T extends RenderController<any, any, infer E> ? E : never;

  export type Constructor = {
    new (...args: any[]): RenderController<any, any, any>;
    declareRoot: (typeof RenderController<any, any, any>)["declareRoot"];
  };

  export type InitPayload<T extends RenderController.Constructor> = {
    state: Reference.Readonly<RenderController.ToState<InstanceType<T>>>;
    auxiliary: RenderController.ToOptions<InstanceType<T>>;
    ref?: Observable.Subscriber<ElementBuilder.ToNode<
      RenderController.ToElementBuilder<InstanceType<T>>
    > | null>;
  };

  export type InitMethod<T extends RenderController.Constructor> = (
    payload: RenderController.InitPayload<T>,
  ) => RenderController.ToElementBuilder<InstanceType<T>>;

  export type DeclaredRoot<T extends RenderController.Constructor> = {
    $init: RenderController.InitMethod<T>;
  };
}

/**
 * @alpha Experimental API this API is subject to change without notice.
 */
export function createRenderController<
  State extends object,
  Auxiliary,
  T extends ElementBuilder.DOM<any, UpdatableParentNode>,
>(
  root: T,
  lifecycle: LifecycleFn<State, Auxiliary>,
): typeof RenderController<State, Auxiliary, T> {
  return class extends RenderController<State, Auxiliary, T> {
    get rootBuilder(): T {
      return root;
    }

    #lifecycleRenderFn: RenderFn<State, Auxiliary>;

    constructor(state$: Reference.Readonly<State>) {
      super(state$);

      this.#lifecycleRenderFn = lifecycle(state$);
    }

    render(state: State, auxiliary: Auxiliary) {
      return this.#lifecycleRenderFn(state, auxiliary);
    }
  };
}

/**
 * A convenience function to declare a root for a RenderController.
 *
 * @remarks
 *
 * This function avoids having to write duplicate code/types, because TypeScript
 * is unable to reference the class type in the static method.
 *
 * @alpha Experimental API
 */
export function declareControlledRoot<T extends RenderController.Constructor>(
  ControllerConstructor: T,
) {
  return ControllerConstructor.declareRoot<T>();
}
