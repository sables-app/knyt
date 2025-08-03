import type {
  ReactiveController,
  ReactiveControllerHost,
} from "./ReactiveController";

/**
 * @internal scope: workspace
 */
class BasicEffect<H extends ReactiveControllerHost> implements Effect {
  #host: H;
  #setup: Effect.Setup<H>;
  #teardownFn: Effect.Teardown<H> | undefined;
  #isSetup = false;

  constructor(host: H, { setup }: { setup: Effect.Setup<H> }) {
    this.#host = host;
    this.#setup = setup;

    host.addController(this);
  }

  hostConnected() {
    this.setup();
  }

  hostDisconnected() {
    this.teardown();
  }

  setup() {
    if (this.#isSetup) return;

    // Set isSetup to true before calling setup
    // to prevent re-entrant calls to setup.
    // This ensures that the setup function is only called once.
    // If the setup function is called again, it will be a no-op.
    this.#isSetup = true;

    const result = this.#setup(this.#host);

    // Explicitly check if the result is a function
    // to ensure we only assign a teardown function if it is provided.
    // This allows the setup function to return void, which TypeScript
    // allows to be anything, including for example a `Promise` for an
    // asynchronous setup that does not require a teardown.
    this.#teardownFn = typeof result === "function" ? result : undefined;
  }

  teardown() {
    this.#teardownFn?.(this.#host);

    this.#isSetup = false;
    this.#teardownFn = undefined;
  }

  dispose() {
    this.teardown();
    this.#host.removeController(this);
  }
}

/**
 * Creates a reactive controller that can react to the host's lifecycle events.
 *
 * @beta This API is in beta and may change in future releases.
 */
export function createEffect<H extends ReactiveControllerHost>(
  host: H,
  setup: Effect.Setup<H>,
): Effect {
  return new BasicEffect(host, { setup });
}

export type Effect = ReactiveController & {
  /**
   * Sets up the effect
   *
   * @remarks
   *
   * This is typically called when the host is connected.
   */
  setup(): void;
  /**
   * Tears down the effect
   *
   * @remarks
   *
   * This is typically called when the host is disconnected.
   */
  teardown(): void;
  /**
   * Disposes of the effect, tearing it down and preventing
   * it from be **automatically** set up again.
   *
   * @remarks
   *
   * This should be called when the effect is no longer needed.
   */
  dispose(): void;
};

export namespace Effect {
  export type Teardown<H> = (host: H) => void;
  export type Setup<H> = (host: H) => Teardown<H> | void;
}

export {
  // An alias for convenience
  createEffect as effect,
};
