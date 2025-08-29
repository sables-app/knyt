import { isNonNullableObject } from "@knyt/artisan";

/**
 * Determines whether the input is a {@link ReactiveControllerHost}.
 *
 * @public
 */
export function isReactiveControllerHost(
  value: unknown,
): value is ReactiveControllerHost {
  return (
    isNonNullableObject(value) &&
    "addController" in value &&
    typeof (value as ReactiveControllerHost).addController === "function" &&
    "removeController" in value &&
    typeof (value as ReactiveControllerHost).removeController === "function" &&
    "requestUpdate" in value &&
    typeof (value as ReactiveControllerHost).requestUpdate === "function"
  );
}

/**
 * Knyt is made compatible with Lit by implementing the
 * `ReactiveController` and `ReactiveControllerHost` interfaces.
 *
 * The following interfaces were originally copied from `@lit/reactive-element` package,
 * and comments modified to fit accommodate the lifecycle hooks in Knyt.
 *
 * @see https://github.com/lit/lit/blob/main/packages/reactive-element/src/reactive-controller.ts
 */

// -------------------------------

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * An object that can host Reactive Controllers and call their lifecycle
 * callbacks.
 */
export interface ReactiveControllerHost {
  /**
   * Adds a controller to the host, which sets up the controller's lifecycle
   * methods to be called with the host's lifecycle.
   */
  addController(controller: ReactiveController): void;
  /**
   * Removes a controller from the host.
   */
  removeController(controller: ReactiveController): void;
  /**
   * Requests a host update which is processed asynchronously. The update can
   * be waited on via the `updateComplete` property.
   */
  requestUpdate(): void;
  /**
   * Returns a Promise that resolves when the host has completed updating.
   * The Promise value is a boolean that is `true` if the element completed the
   * update without triggering another update. The Promise result is `false` if
   * a property was set inside `updated()`. If the Promise is rejected, an
   * exception was thrown during the update.
   *
   * @returns A promise of a boolean that indicates if the update resolved
   *     without triggering another update.
   */
  readonly updateComplete: Promise<boolean>;
}
/**
 * A Reactive Controller is an object that enables sub-component code
 * organization and reuse by aggregating the state, behavior, and lifecycle
 * hooks related to a single feature.
 *
 * Controllers are added to a host component, or other object that implements
 * the `ReactiveControllerHost` interface, via the `addController()` method.
 * They can hook their host components's lifecycle by implementing one or more
 * of the lifecycle callbacks, or initiate an update of the host component by
 * calling `requestUpdate()` on the host.
 */
export interface ReactiveController {
  /**
   * Called when the host is connected to the component tree. For custom
   * element hosts, this corresponds to the `connectedCallback()` lifecycle,
   * which is only called when the component is connected to the document.
   */
  hostConnected?(): void;
  /**
   * Called when the host is disconnected from the component tree. For custom
   * element hosts, this corresponds to the `disconnectedCallback()` lifecycle,
   * which is called the host or an ancestor component is disconnected from the
   * document.
   */
  hostDisconnected?(): void;
  /**
   * Called during a host update, immediately before the host commits changes to the DOM.
   *
   * @clientOnly It is not invoked during server-side rendering.
   */
  hostUpdate?(): void;
  /**
   * Called after the host has finished updating and committed changes to the DOM.
   *
   * @remarks
   *
   * This method is invoked immediately following the host's `hostAfterUpdate` lifecycle.
   * It is not invoked during server-side rendering.
   *
   * @clientOnly It is not invoked during server-side rendering.
   */
  hostUpdated?(): void;
}
