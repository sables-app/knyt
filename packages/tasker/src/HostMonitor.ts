import { createReference } from "@knyt/artisan";

import type {
  ReactiveController,
  ReactiveControllerHost,
} from "./ReactiveController.ts";

/**
 * HostMonitor tracks the connection and update status of a host.
 *
 * @remarks
 *
 * An instance must be added to a host during it construction for
 * it to accurately track the host's status.
 *
 * @beta This is an experimental API. It may change in future versions.
 */
export class HostMonitor implements ReactiveController {
  readonly #isHostConnected$ = createReference(false);
  readonly #isHostUpdating$ = createReference(false);
  readonly #hasHostConnected$ = createReference(false);
  readonly #hasHostUpdated$ = createReference(false);

  readonly isHostConnected$ = this.#isHostConnected$.asReadonly();
  readonly isHostUpdating$ = this.#isHostUpdating$.asReadonly();
  readonly hasHostConnected$ = this.#hasHostConnected$.asReadonly();
  readonly hasHostUpdated$ = this.#hasHostUpdated$.asReadonly();

  get isHostConnected() {
    return this.#isHostConnected$.value;
  }

  get isHostUpdating() {
    return this.#isHostUpdating$.value;
  }

  get hasHostConnected() {
    return this.#hasHostConnected$.value;
  }

  get hasHostUpdated() {
    return this.#hasHostUpdated$.value;
  }

  constructor(host: ReactiveControllerHost) {
    host.addController(this);
  }

  hostConnected(): void {
    this.#isHostConnected$.set(true);

    if (!this.#hasHostConnected$.value) {
      this.#hasHostConnected$.set(true);
    }
  }

  hostDisconnected(): void {
    this.#isHostConnected$.set(false);
  }

  hostUpdate(): void {
    this.#isHostUpdating$.set(true);

    if (!this.#hasHostUpdated$.value) {
      this.#hasHostUpdated$.set(true);
    }
  }

  hostUpdated(): void {
    this.#isHostUpdating$.set(false);
  }
}
