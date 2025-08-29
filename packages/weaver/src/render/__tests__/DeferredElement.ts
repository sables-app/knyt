export type UpdateStrategy = [numOfUpdates: number, durationPerUpdate: number];

/**
 * @example
 *
 * ```ts
 * dom["test-deferred-element"].strategy([1, 50])
 * ```
 */
export class DeferredElement extends HTMLElement {
  #updateComplete: PromiseWithResolvers<boolean> | undefined;

  get updateComplete(): Promise<boolean> {
    return this.#updateComplete?.promise ?? Promise.resolve(true);
  }

  #strategy: UpdateStrategy = [1, 100];

  /**
   * The strategy for how the element should update.
   *
   * `[numOfUpdates: number, durationPerUpdate: number]`
   */
  get strategy() {
    return this.#strategy;
  }

  set strategy(strategy: UpdateStrategy) {
    this.#strategy = strategy;

    // All side effects are asynchronous, so we need to wait for the next
    // microtask to run the completion strategy.
    queueMicrotask(() => {
      this.#runCompletionStrategy();
    });
  }

  #runCompletionStrategy() {
    const [numOfUpdates, durationPerUpdate] = this.#strategy;

    let updateCount = 0;

    // Start the first update as incomplete
    this.#updateComplete = Promise.withResolvers<boolean>();

    if (numOfUpdates <= 0) {
      this.#updateComplete.resolve(true);
      return;
    }

    const interval = setInterval(() => {
      updateCount++;

      if (updateCount >= numOfUpdates) {
        clearInterval(interval);
        // Mark the current update as complete with no more updates pending
        this.#updateComplete?.resolve(true);
        return;
      }

      // Mark the current update as complete with more updates pending
      this.#updateComplete?.resolve(false);
      // Reset the promise to allow for the next iteration
      this.#updateComplete = Promise.withResolvers<boolean>();
    }, durationPerUpdate);
  }
}

export function defineDeferredElement() {
  if (!customElements.get("test-deferred-element")) {
    customElements.define("test-deferred-element", DeferredElement);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "test-deferred-element": DeferredElement;
  }
}
