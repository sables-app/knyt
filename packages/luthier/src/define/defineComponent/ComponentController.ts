import { createReference } from "@knyt/artisan";
import { css, type StyleSheet } from "@knyt/tailor";
import {
  __hostAdapter,
  applyControllableMixin,
  ControllableAdapter,
} from "@knyt/tasker";
import type { Controllable, ReactiveController } from "@knyt/tasker";
import {
  build,
  dom,
  renderElementToString,
  update,
  type RenderOptions,
} from "@knyt/weaver";
import type { AnyProps, ElementBuilder, KnytDeclaration } from "@knyt/weaver";

import { convertPropertiesDefinition } from "../../convertPropertiesDefinition";
import {
  __reactiveAdapter,
  applyReactiveMixin,
  ReactiveAdapter,
} from "../../Reactive";
import type { Reactive } from "../../Reactive";
import type { PropertiesDefinition } from "../../types";
import { defineKnytElement } from "../defineKnytElement";
import type { Component } from "./Component";

// TODO: Consider exporting `ComponentHost` instead to use `ComponentHost.tagName`.
export const COMPONENT_HOST_TAG_NAME = "knyt-component-host";

const ComponentHost = defineKnytElement({
  tagName: COMPONENT_HOST_TAG_NAME,
  styleSheet: css({
    host: {
      selector: `:host, ${COMPONENT_HOST_TAG_NAME}`,
      styles: {
        display: "none",
      },
    },
  }),
  lifecycle: () => () => dom.fragment,
  options: {
    renderMode: "opaque",
    shadowRoot: false,
  },
});

type ComponentHostElement = InstanceType<typeof ComponentHost.Element>;

declare global {
  interface HTMLElementTagNameMap {
    "knyt-component-host": ComponentHostElement;
  }
}

/**
 * @deprecated This is an experimental API that will change in the future.
 */
export class ComponentController<P extends AnyProps, E extends Element>
  implements ReactiveController, Controllable, Reactive
{
  readonly #properties: PropertiesDefinition<P>;
  readonly #lifecycle: Component.LifecycleFn<P, E>;

  #childrenRenderer: Component.RendererFn<P, E>;

  readonly latestChildren$ = createReference<KnytDeclaration | undefined>(
    undefined,
    () => this.requestUpdate(),
  );

  readonly root$ = createReference<E | null>(
    null,
    (currentRoot, previousRoot) => {
      this.requestUpdate();

      if (previousRoot) {
        // Do nothing, because root element enhancements
        // should be idempotent and allow for overwriting.
      }
      if (currentRoot) {
        this.#enhanceRootElement(currentRoot);
      }
    },
  );

  /**
   * Add `updateComplete` property to the element
   * to allow the element to be awaited by the `render`
   * function.
   *
   * @see RenderOptions.reactiveElementTimeout
   */
  /*
   * ### Private Remarks
   *
   * This must be idempotent and allow for overwriting,
   * because we don't want to assume how the renderer will
   * handle the element. The element may be reused, or it
   * may be a new element.
   */
  #enhanceRootElement(el: E) {
    const getUpdateComplete = () => this.updateComplete;

    Object.defineProperty(el, "updateComplete", {
      // We need to allow the property to be redefined
      // again in case the element is reused.
      configurable: true,
      get() {
        return getUpdateComplete();
      },
    });

    Object.defineProperty(el, "renderToString", {
      // We need to allow the property to be redefined
      // again in case the element is reused.
      configurable: true,
      value: async (options?: RenderOptions): Promise<string> => {
        const rootEl = this.root$.get();

        if (!rootEl) {
          // This should never happen, because the root element
          // should be set when the controller is created.
          // But just in case, we'll log a warning.

          console.warn(
            "ComponentController.renderToString: root element is not set",
          );

          return "";
        }

        const { rootChildren } = this.#renderRootChildren({
          disableHost: true,
        });

        return renderElementToString({
          children: "",
          element: rootEl,
          contents: rootChildren,
          options,
        });
      },
    });
  }

  #isHostConnected = false;

  readonly host$ = createReference<ComponentHostElement | null>(
    null,
    (currentHost, previousHost) => {
      if (previousHost) {
        previousHost.removeController(this);

        // This should only happen if the host changes while
        // it's still connected to the DOM.
        // Rare case, but possible.
        //
        // It only matters if the host is connected,
        // otherwise the host will be disconnected anyway.
        //
        // In the case where there is a `currentHost` and `previousHost`,
        // the host will be replaced, and the controller will be switched
        // to the new host, but the connected and disconnected callbacks
        // will not be called.
        if (!currentHost && this.#isHostConnected) {
          this.hostDisconnected();
        }
      }
      if (currentHost) {
        currentHost.addController(this);

        if (currentHost.isConnected && !this.#isHostConnected) {
          this.hostConnected();
        }
      }
    },
  );

  [__reactiveAdapter]: ReactiveAdapter;
  [__hostAdapter]: ControllableAdapter;

  declare getProp: ReactiveAdapter<P>["getProp"];
  declare getProps: ReactiveAdapter<P>["getProps"];
  declare refProp: ReactiveAdapter<P>["refProp"];
  declare observePropChange: ReactiveAdapter<P>["observePropChange"];
  declare onPropChange: ReactiveAdapter<P>["onPropChange"];
  declare setProp: ReactiveAdapter<P>["setProp"];
  declare setProps: ReactiveAdapter<P>["setProps"];

  declare addController: ControllableAdapter["addController"];
  declare controlInput: ControllableAdapter["controlInput"];
  declare hold: ControllableAdapter["hold"];
  declare removeController: ControllableAdapter["removeController"];
  declare requestUpdate: ControllableAdapter["requestUpdate"];
  declare track: ControllableAdapter["track"];
  declare untrack: ControllableAdapter["untrack"];
  declare updateComplete: ControllableAdapter["updateComplete"];
  declare _getReactiveControllers: ControllableAdapter["_getReactiveControllers"];

  hostConnected(): void {
    this.#isHostConnected = true;
    this[__hostAdapter].connectedCallback();
  }

  hostDisconnected(): void {
    this.#isHostConnected = false;
    this[__hostAdapter].disconnectedCallback();
  }

  constructor({ properties, lifecycle }: ComponentController.Options<P, E>) {
    this.#properties = properties;
    this.#lifecycle = lifecycle;

    this[__reactiveAdapter] = new ReactiveAdapter({
      reactiveProperties: convertPropertiesDefinition(properties),
      hooks: this.#createReactiveAdapterHooks(),
      options: {},
    });

    this[__hostAdapter] = new ControllableAdapter({
      performUpdate: () => this.#updateRoot(),
    });

    this.#childrenRenderer = this.#lifecycle.call(this, this);
  }

  #hostContainer$ = createReference<HTMLElement | null>(
    null,
    async (currentHostContainer, previousHostContainer) => {
      if (previousHostContainer) {
        const host = this.host$.get();

        if (host) {
          previousHostContainer.removeChild(host);
        }
      }

      if (currentHostContainer) {
        // Defer the creation of the host element
        // to the next animation frame for better performance.
        //
        // This is because the custom elements are slow to
        // create and we don't want to block the main thread.
        //
        // One of the reason to use a Component instead of a
        // custom element is to avoid the overhead of creating
        // a custom element, so we want to avoid blocking the
        // main thread for the first render.
        await new Promise(requestAnimationFrame);
        // await new Promise((resolve) => setTimeout(resolve, 5000));

        const host = (await build(
          ComponentHost(),
        )) as unknown as ComponentHostElement;

        this.host$.set(host);
        currentHostContainer.appendChild(host);
      }
    },
  );

  #renderHost() {
    return ComponentHost().$ref(this.host$).$renderMode("opaque");
  }

  #createReactiveAdapterHooks(): ReactiveAdapter.Hooks {
    const getIsConnected = () => {
      return this.host$.get()?.isConnected ?? false;
    };

    return {
      get isConnected() {
        return getIsConnected();
      },
      removeAttribute: (name) => {
        this.root$.get()?.removeAttribute(`data-${name}`);
      },
      setAttribute: (name, value) => {
        this.root$.get()?.setAttribute(`data-${name}`, value);
      },
      requestUpdate: () => {
        this.requestUpdate();
      },
    };
  }

  #renderRootChildren({ disableHost }: { disableHost?: boolean } = {}) {
    const props = this.getProps();
    const children = this.latestChildren$.get();

    let hostWasRendered = false;

    const Host = () => {
      hostWasRendered = true;

      if (disableHost) {
        return dom.fragment;
      }

      return this.#renderHost();
    };

    return {
      hostWasRendered,
      rootChildren: this.#childrenRenderer({
        props,
        children,
        Host,
      }),
    };
  }

  async #updateRoot(): Promise<void> {
    return this[__hostAdapter].stageModification({
      // The modification should be performed if
      // when the host is available & connected,
      // or if the host is not available yet.
      shouldModify: this.host$.get()?.isConnected ?? true,
      modification: async () => {
        const rootEl = this.root$.value;

        if (!rootEl) return;

        const { hostWasRendered, rootChildren } = this.#renderRootChildren();

        const updateInput = hostWasRendered
          ? rootChildren
          : dom.fragment.$children(rootChildren);

        await update(rootEl, updateInput);
      },
    });
  }
}

applyReactiveMixin(ComponentController, [
  "getProp",
  "getProps",
  "observePropChange",
  "onPropChange",
  "refProp",
  "setProp",
  "setProps",
]);

applyControllableMixin(ComponentController, [
  "addController",
  "controlInput",
  "hold",
  "removeController",
  "requestUpdate",
  "track",
  "untrack",
  "updateComplete",
  "_getReactiveControllers",
]);

export namespace ComponentController {
  export type Options<P extends AnyProps, E extends Element> = {
    debug?: boolean;
    lifecycle: Component.LifecycleFn<P, E>;
    properties: PropertiesDefinition<P>;
    /**
     * @alpha
     */
    styleSheet?: StyleSheet<any>;
  };

  export type HostFn = () => ElementBuilder.DOM<{}>;
}
