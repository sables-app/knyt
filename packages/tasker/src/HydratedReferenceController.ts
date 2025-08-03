import {
  ensureReference,
  isClientSide,
  isText,
  parseData,
  serializeData,
  type Reference,
} from "@knyt/artisan";
import {
  html,
  isResourceRendererHost,
  type ResourceRenderer,
  type ResourceRendererHost,
} from "@knyt/weaver";

import {
  isLifecycleDelegateHost,
  type LifecycleDelegate,
  type LifecycleDelegateHost,
} from "./LifecycleDelegate";
import type {
  ReactiveController,
  ReactiveControllerHost,
} from "./ReactiveController";

// Banned globals
declare const document: never;
declare const window: never;

const SCRIPT_ATTR_NAME = "data-knytdata";

/**
 * A controller that manages the hydration of a state reference.
 *
 * @alpha This is an experimental API and will change in the future.
 */
export class HydratedReferenceController<T>
  implements
    ReactiveController,
    ResourceRenderer,
    LifecycleDelegate<Record<string, unknown>>
{
  #host: ReactiveControllerHost;
  /**
   * The name of the state, used for finding the script element
   * that contains the serialized state data.
   */
  #name: string;
  /**
   * The target element where the script element will be rendered inside.
   */
  #target: Reference.Readonly<ParentNode | null>;

  readonly value$: Reference<T>;

  constructor(
    host: ReactiveControllerHost,
    options: HydratedReferenceController.Options<T>,
  ) {
    this.#host = host;

    const { name, parent, ref } = options;

    this.#name = name;
    this.#target = ensureReference(parent);
    this.value$ = ref;

    host.addController(this);

    if (isResourceRendererHost(host)) {
      host.addRenderer(this);
    }
    if (isLifecycleDelegateHost(host)) {
      host.addLifecycleDelegate(this);
    }
  }

  hostRender() {
    if (isClientSide()) return null;

    return html.template
      .$attrs({
        [SCRIPT_ATTR_NAME]: this.#name,
      })
      .$(this.#getSerializedState());
  }

  #restored = false;

  hostBeforeMount() {
    if (this.#restored) return;

    this.#restored = true;

    // On the client side, restore state from the script element before the first render.
    // The script element is removed after the initial render, so restoration must occur here.
    // The controller should be constructed after the host sets up the root element,
    // ensuring the script element is present in the DOM.
    this.#restoreStateFromTemplate();
  }

  hostConnected?(): void;

  #getSerializedState() {
    try {
      // TODO: Add support for custom serialization if needed
      // This assumes that the state can be serialized to JSON.
      return serializeData(this.value$.value);
    } catch (error) {
      console.error("Failed to serialize state:", error);
      // Fallback to `null` if serialization fails.
      return "null";
    }
  }

  /**
   * Attempts to restore the state from a script element
   * that contains serialized state data if available.
   */
  #restoreStateFromTemplate() {
    const parent = this.#target.get();
    const template = parent?.querySelector<HTMLTemplateElement>(
      `template[${SCRIPT_ATTR_NAME}="${this.#name}"]`,
    );
    const firstNode = template?.content.childNodes[0];

    if (firstNode === undefined) {
      // If no first node is found, we do nothing.
      return;
    }

    if (!isText(firstNode)) {
      console.error(
        `Expected the first child of the template to be a text node, but got: ${firstNode.nodeName}`,
      );
      return;
    }

    const serializedState = firstNode.textContent?.trim();

    if (serializedState === undefined) {
      // If no serialized state is found, we do nothing.
      return;
    }

    try {
      // TODO: Add support for custom deserialization if needed
      // This assumes that the state can be deserialized from JSON.
      const parsedState = parseData<T>(serializedState);

      this.value$.set(parsedState);
    } catch (error) {
      console.error("Failed to parse serialized state:", error);
    }
  }
}

export namespace HydratedReferenceController {
  export type Options<T> = {
    /**
     * A unique identifier within the parent node,
     * used to locate the script element containing the serialized state data.
     * Ensure this name is unique among siblings to prevent conflicts.
     * It is required for retrieving the correct script element during hydration.
     */
    name: string;
    /**
     * The direct parent node where the script element will be rendered.
     */
    parent: Reference.Maybe<ParentNode>;
    /**
     * The reference to add hydration functionality to.
     */
    ref: Reference<T>;
  };

  /**
   * A host that meets all of the requirements for hydrated state controllers,
   * without the need for customized integration.
   */
  export type CompleteHost = ReactiveControllerHost &
    ResourceRendererHost &
    LifecycleDelegateHost;
}
