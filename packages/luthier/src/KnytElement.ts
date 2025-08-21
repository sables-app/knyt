/// <reference lib="dom.iterable" />
import {
  elementHasFocus,
  isCSSStyleSheet,
  isHTMLElement,
  isPromiseLike,
  isServerSide,
  isShadowRoot,
  type BoundMap,
  type DOMAttributeValue,
  type OptionalAndComplete,
  type Reference,
} from "@knyt/artisan";
import {
  css,
  getCSSStyleSheetConstructor,
  isStyleSheet,
  type StyleSheet,
} from "@knyt/tailor";
import {
  __hostAdapter,
  __lifecycle,
  applyControllableMixin,
  applyLifecycleMixin,
  ControllableAdapter,
  createEffect,
  EventListenerController,
  EventListenerManager,
  hydrateRef,
  LifecycleAdapter,
  listenTo,
  StyleSheetAdoptionController,
  type Controllable,
  type Effect,
  type EventListenableObserver,
  type Lifecycle,
  type LifecycleDelegateHost,
  type ReactiveControllerHost,
} from "@knyt/tasker";
import {
  BasicResourceRendererHost,
  dom,
  html,
  normalizeRenderResult,
  renderElementToString,
  RenderMode,
  setRenderMode,
  update,
  type KnytContent,
  type KnytDeclaration,
  type RenderOptions,
  type RenderResult,
  type ResourceRenderer,
  type ResourceRendererHost,
  type UpdateOptions,
} from "@knyt/weaver";

import { KNYT_DEBUG_DATA_ATTR } from "./constants";
import { convertPropertiesDefinition } from "./convertPropertiesDefinition";
import { getConstructorStaticMember } from "./getConstructorStaticMember";
import { HtmxIntegration, type HtmxObject } from "./HtmxIntegration";
import {
  __reactiveAdapter,
  applyReactiveMixin,
  ReactiveUpdateMode,
  withReactivity,
  type Reactive,
  type ReactiveAdapter,
} from "./Reactive";
import type { PropertiesDefinition, PropertyName } from "./types";

/**
 * @alpha
 */
export type KnytElementOptions = {
  /**
   * Specifies how the element should be rendered by an external renderer.
   *
   * @see {@link https://knyt.dev/guide/render-modes}
   *
   * @remarks
   *
   * There are two render modes: opaque and transparent.
   *
   * In opaque mode, the element fully manages the rendering of its children,
   * and external renderers should not modify its contents.
   *
   * In transparent mode, the element allows its children to be rendered
   * or managed by an external renderer.
   *
   * @defaultValue "transparent"
   */
  renderMode?: `${RenderMode}`;
  /**
   * Specifies whether the element should use a shadow root, and provides options if enabled.
   *
   * If `false`, the element will not have a shadow root.
   * If a `ShadowRootInit` object is provided, a shadow root will be attached using those options.
   *
   * @defaultValue `{ mode: "closed" }`
   */
  shadowRoot?: false | ShadowRootInit;
  /**
   * Determines how the element is updated.
   *
   * @defaultValue "reactive"
   */
  updateMode?: `${ReactiveUpdateMode}`;
  /**
   * Controls whether adopted stylesheets are included during server-side rendering.
   *
   * @remarks
   *
   * When enabled, adopted style sheets will not be rendered as <style> elements in the server-side output.
   * By default, each adopted style sheet is rendered as a <style> element for every instance of the element,
   * which can result in a large number of style tags in the generated HTML.
   *
   * Use this option if you want to prevent all adopted style sheets adopted by the element from being rendered
   * server-side. To selectively exclude a specific style sheet from SSR, use the `disableSSR` option on the
   * style sheet itself.
   *
   * @see {@link StyleSheet}
   */
  disableStylesheetSSR?: boolean;
  /**
   * Threshold for appending children in chunks.
   *
   * @remarks
   *
   * If the number of children exceeds this threshold, they are appended in chunks
   * using `requestAnimationFrame` to prevent blocking the main thread.
   *
   * @see {@link UpdateOptions.appendChunkSize}
   *
   * @alpha This is an experimental API and WILL change in the future without notice.
   */
  appendChunkSize?: UpdateOptions["appendChunkSize"];
  /**
   * When enabled, the element's shadow root will be processed by htmx.
   *
   * @remarks
   *
   * For this to work, `htmx` must be either available globally,
   * or passed as an option to the element.
   *
   * @see {@link https://htmx.org/examples/web-components/}
   */
  htmx?: boolean | HtmxObject.Compat;
  /**
   * Determines whether the element is a "Container" element.
   *
   * @remarks
   *
   * A container element is defined as one that does not have a shadow root and uses
   * transparent rendering mode. In this mode, the element itself does not render its
   * own children; instead, its children are rendered by an external renderer (Weaver).
   * Without a shadow root, the element's content appears in the light DOM. Together,
   * these conditions mean the element acts purely as a container for its children,
   * delegating rendering responsibility externally.
   *
   * When container mode is enabled, these properties are configured automatically:
   *
   * - `renderMode` is set to `transparent`
   * - `shadowRoot` is set to `false`
   * - `updateMode` is set to `manual`
   * - `disableStylesheetSSR` is set to `true`
   * - `htmx` is set to `false`
   *
   * If the element is created using the `define.element` function, the default `styleSheet`
   * will set `display` to `contents`. This ensures the container does not introduce a new
   * block formatting context or disrupt the layout of its children.
   */
  container?: boolean;
  /**
   * Enables debug mode for the element.
   */
  debug?: boolean;
};

/**
 * This is an experimental API and will change in the future.
 *
 * @internal scope: package
 */
export type ObservedProperties<
  T,
  P extends keyof T,
> = Reference.SubscriberRetaining<{
  [K in P]: T[K];
}>;

/**/
/*
 * ### Private Remarks
 *
 * This must be symbol that's registered globally, so that it can be
 * used to check if an element is a Knyt element across different
 * versions of the library.
 */
const __isKnytElement = Symbol.for("knyt.luthier.isKnytElement");

/**
 * The base class for all Knyt elements.
 *
 * @remarks
 *
 * This class is a mixin of the `Reactive` and `Controllable` mixins.
 * It provides a set of properties and methods that are common to all Knyt elements.
 *
 * @public
 */
/*
 * ### Private Remarks
 *
 * This is an abstract class simply to prevent it from being
 * instantiated directly. It should be used as a base class.
 * However, no methods or properties should be marked as
 * `abstract`. The class should be able to be used as simply as
 * `class extends KnytElement {}`.
 */
export abstract class KnytElement
  extends HTMLElement
  implements KnytElement.Type
{
  /**
   * A reference to a `Document` object that should be used
   * for rendering.
   *
   * @internal scope: package
   */
  get #renderingDocument(): Document {
    return this.#rootElement.ownerDocument;
  }

  /**
   * An adapter to implement the `ReactiveControllerHost` interface.
   *
   * @internal scope: package
   */
  [__hostAdapter] = new ControllableAdapter({
    performUpdate: () => this.#handleUpdateSignal(),
  });

  declare addController: ControllableAdapter["addController"];
  declare controlInput: ControllableAdapter["controlInput"];
  declare hold: ControllableAdapter["hold"];
  declare removeController: ControllableAdapter["removeController"];
  declare requestUpdate: ControllableAdapter["requestUpdate"];
  declare track: ControllableAdapter["track"];
  declare untrack: ControllableAdapter["untrack"];
  declare updateComplete: ControllableAdapter["updateComplete"];
  declare watch: ControllableAdapter["watch"];

  /** @internal scope: package */
  declare [__reactiveAdapter]: ReactiveAdapter;

  // TODO: Investigate if it's possible to determine the `Props` type from `this`
  // instead of having to pass `this` or `Partial<this>` as a type argument.
  // It's better to have some type safety here, rather than none,
  // so we're passing in `this` instead of using something like `Record<string, unknown>`.
  declare getProp: ReactiveAdapter<this>["getProp"];
  declare getProps: ReactiveAdapter<Readonly<Partial<this>>>["getProps"];
  declare refProp: ReactiveAdapter<this>["refProp"];
  declare observePropChange: ReactiveAdapter<this>["observePropChange"];
  declare onPropChange: ReactiveAdapter<this>["onPropChange"];
  declare setProp: ReactiveAdapter<this>["setProp"];
  declare setProps: ReactiveAdapter<this>["setProps"];

  /** @internal scope: package */
  /*
   * ### Private Remarks
   *
   * We have to use `any` here, because we don't currently have a way to
   * provide the expected props to a `KnytElement` instance.
   *
   * TODO: Add a generic type parameter to `KnytElement` that
   * represents the expected props of the element.
   */
  [__lifecycle] = new LifecycleAdapter<any>();

  declare addDelegate: LifecycleAdapter<any>["addDelegate"];
  declare onBeforeMount: LifecycleAdapter<any>["onBeforeMount"];
  declare onMounted: LifecycleAdapter<any>["onMounted"];
  declare onBeforeUpdate: LifecycleAdapter<any>["onBeforeUpdate"];
  declare onUpdated: LifecycleAdapter<any>["onUpdated"];
  declare onUnmounted: LifecycleAdapter<any>["onUnmounted"];
  declare onErrorCaptured: LifecycleAdapter<any>["onErrorCaptured"];
  declare removeDelegate: LifecycleAdapter<any>["removeDelegate"];

  /**
   * Enables debug mode for the element
   *
   * @public
   */
  debug?: boolean;

  get #isDebugMode(): boolean {
    if (this.debug === undefined) {
      this.debug = this.getAttribute(KNYT_DEBUG_DATA_ATTR) === "true";
    }

    return this.debug;
  }

  #debugLog(message: any): void {
    if (this.#isDebugMode) {
      console.debug(message);
    }
  }

  /**
   * Defines the reactive properties of the element
   *
   * @public
   */
  static properties: Readonly<PropertiesDefinition<any>> = {};

  /**
   * The default style sheet(s) adopted by the element
   *
   * @public
   */
  // TODO: Add support for an array of style sheets
  static styleSheet: StyleSheet<any> | undefined;

  /**
   * The observed attributes of the element.
   *
   * Do not rename. The name is standardized by the Web Components API.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#responding_to_attribute_changes | MDN Reference}.
   *
   * @remarks
   *
   * This property is derived from the `properties` static property.
   * It returns the attribute name for each reactive element with an attribute name.
   *
   * @public
   */
  static get observedAttributes(): string[] {
    return convertPropertiesDefinition(this.properties).reduce<string[]>(
      (result, { attributeName }) => {
        if (attributeName) {
          result.push(attributeName);
        }

        return result;
      },
      [],
    );
  }

  /**
   * Render the element's contents; i.e. the children of the root element.
   */
  async #renderRootContents(): Promise<KnytDeclaration> {
    const content = await normalizeRenderResult(this.render());
    const resourcePromises = this.#resourceRenderers.render();
    const resources = resourcePromises.some(isPromiseLike)
      ? await Promise.all(resourcePromises)
      : (resourcePromises as readonly KnytContent[]);

    if (resources.length === 0) {
      return content;
    }

    return dom.fragment.$(...resources, content);
  }

  /**
   * Updates the root contents of the element.
   *
   * @remarks
   *
   * This method shouldn't be called directly. This is called
   * should be called by the `ReactiveControllerHostAdapter` after
   * a request to update the element is made.
   *
   * @internal scope: package
   */
  async #updateRoot(): Promise<void> {
    this.#debugLog("#updateRoot called");

    return this[__hostAdapter].stageModification({
      shouldModify: this.isConnected,
      modification: async () => {
        this.#debugLog("#updateRoot: before update");

        await update(this.#rootElement, await this.#renderRootContents(), {
          document: this.#renderingDocument,
          appendChunkSize: this.#appendChunkSize,
        });

        this.#debugLog("#updateRoot: after update");
      },
    });
  }

  /**
   * Renders the element's contents as a declaration representing the
   * element's current state.
   *
   * @public
   */
  /*
   * ### Private Remarks
   *
   * The `renderRootChildren` should be called internally
   * to render the root element.
   */
  // TODO: Consider making public
  protected render(): RenderResult {
    return null;
  }

  /**
   * Serializes the element and its contents to an HTML string.
   *
   * @remarks
   *
   * Useful for server-side rendering or generating static markup.
   *
   * Handles both open and closed shadow roots, rendering them as
   * declarative shadow roots. Adopted stylesheets may be included
   * in the output if configured.
   *
   * @public
   */
  async renderToString(
    children: string,
    options?: RenderOptions,
  ): Promise<string> {
    const shadowRootMode = isShadowRoot(this.#rootElement)
      ? this.#rootElement.mode
      : undefined;

    // If the element is a container, it doesn't render its own contents.
    // Instead, it relies on the children passed to this method.
    const contents = this.#isContainer
      ? undefined
      : await this.#renderRootContents();

    return renderElementToString({
      children,
      element: this,
      shadowRootMode,
      contents,
      options,
    });
  }

  /** @internal scope: package */
  get [__isKnytElement](): true {
    return true;
  }

  /**
   * Provides quick and easy access to the shadow root of the element,
   * because `element.shadowRoot` isn't be available immediately after the element
   * is constructed.
   *
   * @internal scope: package
   */
  readonly #rootElement: ShadowRoot | HTMLElement;

  readonly #styleSheetAdoption: StyleSheetAdoptionController;

  /**
   * Indicates whether the element is a "Container" element.
   */
  #isContainer: boolean;

  /**
   * Determines whether the element has focus.
   */
  hasFocus(child?: Element): boolean {
    return elementHasFocus(this.#rootElement, child);
  }

  /**
   * Whether the element has a declarative shadow root
   * upon construction.
   */
  #hadDeclarativeShadowRoot = false;

  /**
   * Determines whether the element should render adopted stylesheets
   * server-side.
   *
   * @see {@link KnytElementOptions.disableStylesheetSSR}
   */
  readonly #disableStylesheetSSR: boolean;
  readonly #appendChunkSize: number | undefined;

  constructor(options: KnytElementOptions = {}) {
    super();

    const preparedOptions = prepareElementOptions(options);
    const renderMode = preparedOptions.renderMode ?? RenderMode.Transparent;
    const shadowRootEnabled = preparedOptions.shadowRoot !== false;
    const shadowRootInit = preparedOptions.shadowRoot || { mode: "open" };
    const htmxInput = preparedOptions.htmx;
    const updateMode = preparedOptions.updateMode;

    if (preparedOptions.debug) {
      this.debug = true;
    }

    this.#isContainer = preparedOptions.container ?? false;
    this.#disableStylesheetSSR = preparedOptions.disableStylesheetSSR ?? false;
    this.#appendChunkSize = preparedOptions.appendChunkSize;

    // This should be the first thing setup in the constructor,
    // so that the element is properly initialized.
    withReactivity({
      instance: this,
      properties: getKnytElementProperties(this),
      hooks: this,
      options: { updateMode },
    });

    if (shadowRootEnabled) {
      const { wasDeclarative, shadowRoot } = ensureShadowRoot(
        this,
        shadowRootInit,
      );

      this.#hadDeclarativeShadowRoot = wasDeclarative;
      this.#rootElement = shadowRoot;

      if (htmxInput) {
        this.addController(new HtmxIntegration(htmxInput, shadowRoot));
      }
    } else {
      this.#rootElement = this;
    }

    setRenderMode(this, renderMode);

    this.#styleSheetAdoption = createStyleSheetAdoptionController(
      this,
      this.#rootElement,
    );

    this.#postConstruct();
  }

  /**
   * Called immediately after the constructor completes.
   * Use this for any initialization that must occur after the element
   * has been fully constructed.
   *
   * @remarks
   *
   * Separating this from the constructor helps ensure that
   * post-construction logic runs only after the element is fully initialized,
   * improving clarity and maintainability.
   */
  #postConstruct(): void {
    // Adopt the static stylesheet if it exists.
    {
      const staticStyleSheet = getKnytElementStyleSheet(this);

      if (staticStyleSheet) {
        // NOTE: Avoid using `this.#styleSheetAdoption` directly here,
        // to ensure the stylesheet is adopted properly in both
        // client-side and server-side rendering scenarios.
        if (Array.isArray(staticStyleSheet)) {
          for (const styleSheet of staticStyleSheet) {
            this.adoptStyleSheet(styleSheet);
          }
        } else {
          this.adoptStyleSheet(staticStyleSheet);
        }
      }
    }
  }

  #addStylesheetFromHref(url: { href: string }): void {
    this.addRenderer({
      hostRender() {
        // This is just a micro-optimization to choose the
        // most efficient builder for the current environment.
        // It's easy in this case, because the properties and
        // attributes perfectly match.
        const builder = isServerSide() ? html : dom;

        return builder.link.rel("stylesheet").href(url.href);
      },
    });
  }

  /**
   * Adopts a style sheet into the element's shadow root or light DOM.
   *
   * @remarks
   *
   * This method can accept either a `StyleSheet` instance or a URL-like
   * object with an `href` property. If a URL-like object is provided,
   * it will create a `<link>` element to load the stylesheet.
   *
   * During server-side rendering, the style sheet will be rendered as a
   * `<style>` element. When hydrating on the client, the `<style>` element
   * will be replaced with an adopted style sheet.
   * This functionality is enabled by default, but can be disabled by setting
   * `disableStylesheetSSR` to `true` in the element's options.
   */
  adoptStyleSheet(
    input: { href: string } | StyleSheetAdoptionController.Input,
  ): void {
    if ("href" in input && !isCSSStyleSheet(input)) {
      this.#addStylesheetFromHref(input);
      return;
    }

    const shouldAddStyleSheetAsResource =
      isServerSide() && !this.#disableStylesheetSSR;

    if (shouldAddStyleSheetAsResource) {
      this.addRenderer(normalizeStyleSheet(input, this.#renderingDocument));
      return;
    }

    this.#styleSheetAdoption.adoptStyleSheet(input);
  }

  /**
   * Drops a style sheet from the element's shadow root or light DOM.
   */
  dropStyleSheet(input: StyleSheetAdoptionController.Input): void {
    this.#styleSheetAdoption.dropStyleSheet(input);
  }

  /**
   * A manager for event listener controllers targeting the element.
   */
  readonly listeners: EventListenerManager<this> = listenTo(this, this);

  /**
   * Adds a new event listener controller targeting the element for the given event name and listener.
   *
   * @beta This is an experimental API and may change in the future.
   */
  on<K extends string>(
    eventName: K,
    listener: EventListenableObserver.Listener<K, this>,
    options?: AddEventListenerOptions,
  ): EventListenerController<K, this> {
    return this.listeners.create(eventName, listener, options);
  }

  hydrateRef(name: string): <R extends Reference<any>>(value$: R) => R;

  /**
   * Restores a state reference from serialized data.
   *
   * @remarks
   *
   * Use this to rehydrate a component's state from serialized data,
   * such as during client-side hydration after server-side rendering.
   * Hydration occurs during the first "beforeMount" lifecycle hook,
   * allowing the component to restore its state before it is mounted.
   *
   * @beta This is an experimental API and may change in the future.
   *
   * @param name - A unique name for the reference, used to identify it in the serialized data.
   * @param value$ - The reactive reference to hydrate.
   */
  hydrateRef<R extends Reference<any>>(name: string, value$: R): R;

  hydrateRef<R extends Reference<any>>(
    name: string,
    arg1?: R,
  ): R | (<R extends Reference<any>>(value$: R) => R) {
    if (arguments.length === 1) {
      return <R extends Reference<any>>(value$: R): R => {
        return this.hydrateRef(name, value$);
      };
    }

    if (!arg1) {
      throw new Error(
        `The second argument to hydrateRef must be a Reference, but received: ${arg1}`,
      );
    }

    hydrateRef(this, {
      name,
      parent: this.#rootElement,
      ref: arg1,
    });

    return arg1;
  }

  /**
   * Restores the value of a reactive property after SSR.
   *
   * @remarks
   *
   * During server-side rendering, reactive properties are not hydrated
   * automatically. Use this method to restore a reactive property value
   * after SSR. This runs only once, during the first "beforeMount"
   * lifecycle hook. The value may still be overridden externally, but
   * this method will not run again.
   *
   * @beta This is an experimental API and may change in the future.
   */
  // TODO: Restrict property names to reactive properties.
  hydrateProp<K extends Exclude<keyof this, symbol>>(propertyName: K) {
    const name = `@prop:${propertyName}`;
    const propRef$ = this.refProp(propertyName);

    return this.hydrateRef(name, propRef$);
  }

  /**
   * Objects that are used to render additional content in the shadow root.
   * These renderers are rendered whenever the element is updated.
   * The renderers are prepended to the shadow root.
   *
   * @internal scope: package
   */
  // TODO: Rename for clarity.
  #resourceRenderers = new BasicResourceRendererHost();

  /**
   * Adds a resource renderer to the element.
   *
   * @see {@link ResourceRenderer}
   */
  addRenderer(input: ResourceRenderer): void {
    this.#resourceRenderers.addRenderer(input);
  }

  /**
   * Removes a renderer from the element.
   */
  removeRenderer(input: ResourceRenderer): void {
    this.#resourceRenderers.removeRenderer(input);
  }

  /**
   * Creates an effect controller and adds it to the host.
   *
   * @remarks
   *
   * Accepts a setup function, called when connected. The setup may return
   * a teardown function, which is called on disconnection.
   *
   * @returns the effect controller instance.
   */
  effect(setup: Effect.Setup<this>): Effect {
    return createEffect(this, setup);
  }

  /**
   * Clears the root element, then builds and inserts new
   * elements into the root element.
   *
   * @internal scope: package
   */
  /*
   * ### Private Remarks
   *
   * Inserting into the root is faster than updating the root upon
   * the first render, if the the element didn't have a declarative
   * shadow root initially.
   */
  // TODO: Test the performance of inserting vs updating the root,
  // when the element doesn't have a declarative shadow root, and
  // it's the first render after being connected to the DOM
  // for the first time. That's extra logic that may not be worth it
  // adding, if the performance difference is negligible.
  //
  // Time would be probably better spent on optimizing the `update`
  // declaration processor instead.
  //
  // Example implementation:
  //
  // if (this.#isFirstEverRender && !this.#hadDeclarativeShadowRoot) {
  //   await this.#insertRoot();
  // } else {
  //   await this.#updateRoot();
  // }
  // async #insertRoot(): Promise<void> {
  //   return this[__hostAdapter].stageModification({
  //     shouldModify: this.isConnected,
  //     modification: async () => {
  //       this.#debugLog("#insert: before build");

  //       const contents = await build(await this.#renderRootContents(), {
  //         document: this.#renderingDocument,
  //       });

  //       this.#debugLog("#insert: after build");

  //       if (!contents) return;

  //       this.#debugLog("#insert: before append");

  //       removeAllChildren(this.#rootElement);
  //       this.#rootElement.appendChild(contents);

  //       this.#debugLog("#insert: after append");
  //     },
  //   });
  // }

  /**
   * A map of changed properties since the last update.
   */
  #changedProperties = new Map<string, any>();

  /**
   * Retrieves the changed properties since the last call to this method,
   * and resets the changed properties map.
   */
  #refreshChangedProperties() {
    const changedProperties = this.#changedProperties;

    this.#changedProperties = new Map();

    return changedProperties as BoundMap.Readonly<any>;
  }

  async #shouldMount(): Promise<boolean> {
    if (this.#isContainer) {
      // If the element is a container, it should not "mount".
      // Mounting is the process of inserting/updating the element's content.
      // Container elements do not render their own content.
      return false;
    }

    const abortController = new AbortController();

    await this[__lifecycle].performBeforeMount({
      abortController,
    });

    return !abortController.signal.aborted;
  }

  async #shouldUpdate(): Promise<boolean> {
    if (this.#isContainer) {
      // If the element is a container, it should not "update".
      // Updating is the process of updating the element's content.
      // Container elements do not render their own content.
      return false;
    }

    const abortController = new AbortController();
    const changedProperties = this.#refreshChangedProperties();

    await this[__lifecycle].performBeforeUpdate({
      abortController,
      changedProperties,
    });

    return !abortController.signal.aborted;
  }

  /**
   * Handles the connected signal for the element.
   */
  /*
   * ### Private Remarks
   *
   * This shouldn't contain any expensive operations, because the connected callbacks are called
   * whenever an element is added, removed, or replaced in th DOM. Simple operations like moving an
   * element 's position in the DOM shouldn't trigger expensive side effects.
   *
   * This method should be public, because it is called by the Web Components API.
   */
  async #handleConnectedSignal(): Promise<void> {
    this.#debugLog("#handleConnectedSignal called");

    try {
      if (await this.#shouldMount()) {
        this.#debugLog("#handleConnectedSignal: before mount update request");
        this.requestUpdate();
        this.#debugLog("#handleConnectedSignal: before mount update complete");
        await this.updateComplete;
        this.#debugLog("#handleConnectedSignal: after mount update complete");
        this[__lifecycle].performMounted();
        this.#debugLog("#handleConnectedSignal: after mounted lifecycle hook");
      }
    } catch (error) {
      this.#handleLifecycleError(error);
    } finally {
      this[__hostAdapter].connectedCallback();
    }
  }

  async #handleUpdateSignal(): Promise<void> {
    this.#debugLog("#handleUpdateSignal called");

    try {
      if (await this.#shouldUpdate()) {
        this.#debugLog("#handleUpdateSignal: before update");
        await this.#updateRoot();
        this.#debugLog("#handleUpdateSignal: after update");
        this[__lifecycle].performUpdated();
        this.#debugLog("#handleUpdateSignal: after updated lifecycle hook");
      }
    } catch (error) {
      this.#handleLifecycleError(error);
    }
  }

  /**
   * Handles errors that occur during the element's lifecycle.
   *
   * This is the private implementation of the `handleLifecycleError` method.
   */
  #handleLifecycleError(error: unknown): void {
    this.#debugLog(`Lifecycle error: ${error}`);

    // Notify the lifecycle hooks about the error.
    this[__lifecycle].handleError(error);

    // Call the error handler if it exists.
    if (typeof this.handleLifecycleError === "function") {
      this.handleLifecycleError(error);
    } else {
      // If no error handler is defined, log the error to the console.
      console.error("Unhandled lifecycle error:", error);
    }
  }

  /**
   * Handles errors that occur during lifecycle events, allowing you to manage errors gracefully
   *
   * @public
   */
  handleLifecycleError?(error: unknown): void;

  /**
   * Called after the element is connected to the DOM.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#lifecycle_callbacks
   *
   * @public
   */
  /*
   * ### Private Remarks
   *
   * Do not rename. The name is standardized by the Web Components API.
   */
  connectedCallback(): void {
    this.#handleConnectedSignal();
  }

  /**
   * Called after the element is disconnected from the DOM.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#lifecycle_callbacks
   *
   * @public
   */
  /*
   * ### Private Remarks
   *
   * Do not rename. The name is standardized by the Web Components API.
   *
   * This shouldn't contain any expensive operations, because the connected callbacks are called
   * whenever an element is added, removed, or replaced in th DOM. Simple operations like moving an
   * element 's position in the DOM shouldn't trigger expensive side effects.
   *
   * This method should be public, because it is called by the Web Components API.
   */
  disconnectedCallback() {
    // NOTE: This can't be mixed in, because it should be accessible via `super.disconnectedCallback()`.
    this[__hostAdapter].disconnectedCallback();
    this[__lifecycle].performUnmounted();
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
   *
   * @public
   */
  /*
   * ### Private Remarks
   *
   * Do not rename. The name is standardized by the Web Components API.
   * This method should be public, because it is called by the Web Components API.
   */
  attributeChangedCallback(
    name: string,
    previousValue: DOMAttributeValue,
    nextValue: DOMAttributeValue,
  ) {
    this[__reactiveAdapter].handleAttributeChanged(
      name,
      previousValue,
      nextValue,
    );
  }

  /**
   * Clones the element, including its reactive properties.
   *
   * @remarks
   *
   * An enhanced version of the default `cloneNode` method that
   * ensures that attribute values derived from reactive properties
   * are copied to the cloned element.
   */
  cloneNode(deep?: boolean): this {
    // Perform the default cloneNode operation.
    const clone = super.cloneNode(deep) as this;

    // Ensure that attribute values derived from reactive properties
    // are copied to the cloned element.
    //
    // The native `cloneNode` method copies attributes but not properties.
    // Since `KnytElement` synchronizes attribute values from properties
    // only after the element is connected to the DOM (to avoid errors in the constructor),
    // we must explicitly copy the attribute values from the original element
    // to the clone immediately after cloning.
    clone[__reactiveAdapter].setAttributeValues(
      this[__reactiveAdapter].getAttributeValues(),
    );

    return clone;
  }

  /**
   * Enables hot module replacement (HMR) support for the element.
   *
   * @remarks
   *
   * This method is intended for compatibility with Open Web Components' HMR system.
   * It is invoked when the element is hot-replaced, allowing the element to refresh
   * or reinitialize itself without a full page reload during development.
   *
   * @see https://github.com/open-wc/open-wc/blob/master/docs/docs/development/hot-module-replacement.md
   *
   * @alpha This is an experimental API and WILL change in the future without notice.
   */
  hotReplacedCallback(): void {
    this.requestUpdate();
  }
}

applyLifecycleMixin(KnytElement, [
  "addDelegate",
  "onBeforeMount",
  "onMounted",
  "onBeforeUpdate",
  "onUpdated",
  "onUnmounted",
  "onErrorCaptured",
  "removeDelegate",
]);

applyReactiveMixin(KnytElement, [
  "getProp",
  "getProps",
  "observePropChange",
  "onPropChange",
  "refProp",
  "setProp",
  "setProps",
]);

applyControllableMixin(KnytElement, [
  "addController",
  "controlInput",
  "hold",
  "removeController",
  "requestUpdate",
  "track",
  "untrack",
  "updateComplete",
  "watch",
]);

export namespace KnytElement {
  /**
   * @internal scope: package
   */
  /**
   * ### Private Remarks
   *
   * Don't move to the `KnytElement.
   */
  export type Type = HTMLElement &
    Controllable &
    Lifecycle &
    LifecycleDelegateHost &
    Reactive &
    ReactiveControllerHost &
    ResourceRendererHost & { [__isKnytElement]: true };

  /**
   * Defines an `KnytElement` with a set of reactive properties.
   *
   * @remarks
   *
   * All properties are a union type with `undefined`, so that they
   * are required properties, but can also be set to `undefined`.
   *
   * This is necessary because reactive properties should always
   * _existI on an `KnytElement`, even if they haven't been defined.
   *
   * @alpha
   */
  export type WithProps<P> = KnytElement &
    // This `OptionalAndComplete` is necessary, because while all properties are optional,
    // for typing to work correctly, they need to be marked as required, but also allow be
    // set to `undefined`.
    //
    // The tradeoff is that we need to use wrap this type in a `Partial`
    // when using other DOM renderers, because they support required properties.
    OptionalAndComplete<P>;

  /**
   * @internal scope: workspace
   */
  export type FromPropertiesDefinition<PD extends PropertiesDefinition<any>> =
    // We don't need to use `OptionalAndComplete` here, because
    // the properties are already a union type with `undefined`
    // included.
    KnytElement & PropertiesDefinition.ToProps<PD>;

  /**
   * Extracts the element instance type from the `ElementDefinition` of a `KnytElement`.
   */
  export type FromElementDefinition<T> = T extends {
    Element: KnytElement.Constructor.Unknown;
  }
    ? InstanceType<T["Element"]>
    : never;

  export interface Constructor<
    E extends KnytElement.Type,
    PD extends PropertiesDefinition<any>,
  > {
    properties: PD;
    styleSheet: KnytElement.StaticStyleSheet;
    new (...params: any[]): E;
  }

  export namespace Constructor {
    export type Any = Constructor<any, any>;

    export type Unknown = Constructor<
      KnytElement.Type,
      PropertiesDefinition<any>
    >;

    export type FromElementOnly<E extends KnytElement = KnytElement> =
      Constructor<E, PropertiesDefinition<any>>;

    /**
     * @internal scope: workspace
     */
    export type FromPropertiesDefinition<PD extends PropertiesDefinition<any>> =
      KnytElement.Constructor<KnytElement.FromPropertiesDefinition<PD>, PD>;

    /**
     * Extracts the properties static member from a KnytElement constructor.
     */
    export type ToPropertiesDefinition<T> = T extends Constructor.Unknown
      ? T["properties"]
      : never;
  }

  /**
   * Infers the "props" from a KnytElement constructor.
   *
   * @internal scope: workspace
   */
  export type ToProps<T> = T extends KnytElement.Constructor.Unknown
    ? PropertiesDefinition.ToProps<
        KnytElement.Constructor.ToPropertiesDefinition<T>
      >
    : never;

  /**
   * Extracts the attribute type from a KnytElement constructor.
   */
  export type ToAttributes<T> = T extends KnytElement.Constructor.Unknown
    ? PropertiesDefinition.ToAttributes<
        KnytElement.Constructor.ToPropertiesDefinition<T>
      >
    : never;

  export type StaticStyleSheet =
    | StyleSheet<any>
    | StyleSheet<any>[]
    | undefined;
}

export function isKnytElement(value: unknown): value is KnytElement {
  return (
    isHTMLElement(value) &&
    __isKnytElement in value &&
    value[__isKnytElement] === true
  );
}

function normalizeStyleSheet(
  input: StyleSheetAdoptionController.Input,
  documentOrShadow: DocumentOrShadowRoot | undefined | null,
): StyleSheet<{}> {
  if (isStyleSheet(input)) {
    return input;
  }
  if (isCSSStyleSheet(input)) {
    return css(input);
  }

  const $CSSStyleSheet = getCSSStyleSheetConstructor(documentOrShadow);
  const cssStyleSheet = input.toCSSStyleSheet($CSSStyleSheet);

  return css(cssStyleSheet);
}

function getKnytElementStaticMember<
  C extends KnytElement.Constructor.Unknown,
  P extends keyof C & PropertyName,
>(element: KnytElement, propertyName: P) {
  return getConstructorStaticMember<C[P], P>(element, propertyName);
}

/**
 * Retrieve the reactive properties from the constructor of an element instance.
 *
 * @remarks
 *
 * This should be called only once for each class; NOT for each instance.
 *
 * @internal scope: package
 */
function getKnytElementProperties<T extends KnytElement = KnytElement>(
  elementInstance: T,
): PropertiesDefinition<T> {
  const result = getKnytElementStaticMember(elementInstance, "properties");

  if (result instanceof Error) {
    return {} as PropertiesDefinition<T>;
  }

  return result;
}

/**
 * @internal scope: package
 */
function getKnytElementStyleSheet<T extends KnytElement = KnytElement>(
  elementInstance: T,
): KnytElement.StaticStyleSheet {
  const result = getKnytElementStaticMember(elementInstance, "styleSheet");

  if (result instanceof Error) {
    return undefined;
  }

  return result;
}

function getRootForStyleSheetAdoptionController(
  rootElement: ShadowRoot | HTMLElement,
): ShadowRoot | Document {
  return isShadowRoot(rootElement) ? rootElement : rootElement.ownerDocument;
}

function createStyleSheetAdoptionController(
  host: ReactiveControllerHost,
  rootElement: ShadowRoot | HTMLElement,
): StyleSheetAdoptionController {
  return new StyleSheetAdoptionController(host, {
    root: getRootForStyleSheetAdoptionController(rootElement),
  });
}

/**
 * Either returns an existing declarative shadow root or creates a new one.
 *
 * @see {@link https://web.dev/articles/declarative-shadow-dom}
 * @internal scope: workspace
 */
function ensureShadowRoot(
  el: HTMLElement,
  shadowRootInit: ShadowRootInit,
): {
  wasDeclarative: boolean;
  shadowRoot: ShadowRoot;
} {
  const supportsDeclarative = Object.hasOwn(
    HTMLElement.prototype,
    "attachInternals",
  );
  const elementInternals = supportsDeclarative
    ? el.attachInternals()
    : undefined;
  const declarativeShadowRoot = elementInternals?.shadowRoot;

  if (declarativeShadowRoot?.mode === shadowRootInit.mode) {
    // Return the existing declarative shadow root if
    // the mode matches the requested mode.
    return {
      wasDeclarative: true,
      shadowRoot: declarativeShadowRoot,
    };
  }

  return {
    wasDeclarative: false,
    // TODO: Add support for `disabledFeatures`
    // See https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#disabling_shadow_dom
    shadowRoot: el.attachShadow(shadowRootInit),
  };
}

/**
 * Determines whether the element is a "Container" element,
 * from the given, unprepared options.
 *
 * @internal scope: package
 */
export function isContainerModeEnabled(options: KnytElementOptions): boolean {
  /**
   * Container mode was specifically requested.
   */
  if (options.container) {
    return true;
  }

  /**
   * The Shadow DOM was requested to be disabled.
   */
  const lightDomRequested = options.shadowRoot === false;
  /**
   * The render mode was either not specified or set to `transparent`.
   * The default render mode is `transparent`, so this should be `true`
   * if the `renderMode` option is not set.
   */
  const hasTransparentRenderMode =
    options.renderMode === undefined ||
    options.renderMode === RenderMode.Transparent;

  /**
   * Container mode is activated when the element does not have a shadow root
   * and the render mode is `transparent`.
   */
  return lightDomRequested && hasTransparentRenderMode;
}

/**
 * Prepares the element options for a KnytElement.
 */
function prepareElementOptions(
  options: KnytElementOptions,
): KnytElementOptions {
  if (isContainerModeEnabled(options)) {
    return {
      ...options,
      renderMode: RenderMode.Transparent,
      shadowRoot: false,
      updateMode: ReactiveUpdateMode.Manual,
      disableStylesheetSSR: true,
      htmx: false,
      container: true,
    };
  }

  return options;
}
