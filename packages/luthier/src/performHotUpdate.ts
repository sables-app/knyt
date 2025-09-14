import { __hostAdapter, __lifecycle } from "@knyt/tasker";
import { __resourceRenderers } from "@knyt/weaver";

import {
  __knytElementComposedLifecycle,
  __knytElementComposedRenderer,
} from "./constants";
import { setComposedRenderer } from "./define/defineKnytElement";
import { __postConstruct, __styleSheetAdoption } from "./KnytElement";
import {
  isKnytElementComposed,
  type KnytElementComposed,
} from "./KnytElementComposed";
import {
  updateInstanceReactivity,
  updatePrototypeReactivity,
} from "./Reactive";

/**
 * Set of constructors currently being updated.
 *
 * @remarks
 *
 * This set prevents overlapping updates to a constructor. If an
 * element's constructor is already being updated, further update
 * attempts are ignored until the current update finishes.
 *
 * This is a safeguard against rare edge cases, such as rapid
 * module replacements or slow computers, where multiple updates
 * could be triggered before the first completes.
 *
 * @internal scope: package
 */
const updatingConstructors = new Set<KnytElementComposed.Constructor>();

/**
 * Perform the update of the previous constructor to the next constructor.
 *
 * @remarks
 *
 * This function should only be called from the previous constructor's
 * `[__knytElementComposedHotUpdate]` static method, which is called
 * by the HMR runtime whenever the module defining the constructor
 * is replaced.
 *
 * This function is asynchronous, but should not await element operations.
 * It does, however, await microtasks at certain points to allow
 * any pending updates or disconnections to complete before proceeding.
 *
 * It performs the following steps:
 *
 * 0. If for some reason both constructors are the same, do nothing.
 * 1. Replace `properties` static property.
 * 2. Update reactive properties as defined on the prototype.
 * 3. Replace `lifecycle` static method.
 * 4. Replace `styleSheet` static property.
 * 5. For each existing instance:
 *     1. Simulate disconnection for each connected instance.
 *     2. If the element is not connected, do nothing.
 * 6. From each instance, remove all current delegates, controllers,
 *    renderers, and style sheets.
 * 7. Update reactivity on each instance.
 * 8. Perform post-construction logic for each instance.
 * 9. Update the renderer function for each instance.
 * 10. For each existing instance:
 *     1. Simulate reconnection for each previously connected instance.
 *     2. If the element is not connected, request an update.
 *
 * @internal scope: package
 */
export async function performHotUpdate({
  tagName,
  prevConstructor,
  nextConstructor,
  instances,
}: {
  /**
   * The tag name of the element being updated.
   * Should only be used for logging purposes.
   */
  tagName: string;
  prevConstructor: KnytElementComposed.Constructor;
  nextConstructor: KnytElementComposed.Constructor;
  instances: HTMLElement[];
}): Promise<void> {
  // Prevent overlapping updates to the same constructor.
  if (updatingConstructors.has(prevConstructor)) {
    console.warn(`[Glazier:HMR] Skipping overlapping update for <${tagName}>.`);
    return;
  }

  updatingConstructors.add(prevConstructor);

  const start = performance.now();

  // 0. If for some reason both constructors are the same, do nothing.
  if (prevConstructor === nextConstructor) return;

  const nextLifecycleFn = nextConstructor[__knytElementComposedLifecycle];

  // 1. Replace `properties` static property.
  prevConstructor.properties = nextConstructor.properties;

  // 2. Update reactive properties as defined on the prototype.
  updatePrototypeReactivity({
    proto: prevConstructor.prototype,
    nextProperties: nextConstructor.properties,
  });

  // 3. Replace `lifecycle` static method.
  //
  // Always update this, even if the functions appear equivalent
  // (e.g., same text via `toString()`), because they may differ in
  // dependencies or internal state. Not updating could cause
  // elements to use outdated logic or views.
  //
  // Strict equality checks (`===`) are not useful here, as
  // supporting that edge case adds complexity without real
  // benefit. Consistently updating ensures correctness.
  prevConstructor[__knytElementComposedLifecycle] = nextLifecycleFn;

  // 4. Replace `styleSheet` static property.
  //
  // No need to check for equality here. Even if the style sheet is
  // unchanged, we must re-adopt it for all instances since their
  // previous sheets will be removed.
  //
  // Setting the static `styleSheet` property has no side effects.
  // If the style sheet is the same, this operation is a no-op.
  prevConstructor.styleSheet = nextConstructor.styleSheet;

  for (const instance of instances) {
    if (!isKnytElementComposed(instance)) {
      // This should never happen.
      console.warn(
        `[Glazier] Skipping element during <${tagName}> hot-replace: not a KnytElementComposed instance.`,
      );
      continue;
    }

    const isElementConnected = instance.isConnected;

    if (isElementConnected) {
      // 5-1. Simulate disconnection for each connected instance.
      instance.disconnectedCallback();
      // Await a microtask so that the `hostUnmounted` hook
      // is triggered before proceeding. This is necessary because
      // the hook is called asynchronously, and it won't be called
      // if we proceed synchronously.
      await Promise.resolve();
    } else {
      // 5-2. If the element is not connected, do nothing.
    }

    // 6. Remove all current delegates, controllers, renderers, and style sheets.
    // 6-1. From each instance, remove all current delegates.
    instance[__lifecycle].clearDelegates();
    // 6-2. From each instance, remove all current controllers.
    instance[__hostAdapter].clearControllers();
    // 6-3. From each instance, remove all current renderers.
    instance[__resourceRenderers].clearRenderers();
    // 6-4. From each instance, remove all current style sheets.
    instance[__styleSheetAdoption].clearStyleSheets();

    // 7. Update reactivity on each instance.
    updateInstanceReactivity({ instance });

    // 8. Perform post-construction logic for each instance.
    //
    // This must be performed after updating reactivity,
    // and clearing controllers and renderers, etc.
    instance[__postConstruct]();

    // 9. Update the renderer function for each instance.
    //
    // This must be done after post-construction logic,
    // because that logic may set up state or properties
    // that the renderer function relies on.
    setComposedRenderer(instance, nextLifecycleFn);

    if (isElementConnected) {
      // 10-1. Simulate reconnection for each previously connected instance.
      instance.connectedCallback();
      // No need to await a microtask here, because there are no
      // further steps to perform for this instance.
    } else {
      // 10-2. If the element is not connected, request an update.
      //
      // This ensures that when the element is eventually connected,
      // it will render with the updated state and logic.
      instance.requestUpdate();
    }
  }

  updatingConstructors.delete(prevConstructor);

  const duration = performance.now() - start;

  console.info(
    `[Glazier:HMR] Updated <${tagName}> in ${duration.toFixed(2)}ms.`,
  );
}
