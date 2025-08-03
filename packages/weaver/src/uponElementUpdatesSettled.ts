import { isNonNullableObject, isPromiseLike } from "@knyt/artisan";

/**
 * A partial interface of `ReactiveControllerHost` that includes
 * only the `updateComplete` property.
 *
 * @internal scope: workspace
 */
export type UpdatableHost = {
  /** @see ReactiveControllerHost["updateComplete"] */
  readonly updateComplete: Promise<boolean>;
};

/**
 * Waits for an element to finish a series of updates.
 *
 * @internal scope: workspace
 *
 * @param host - The element to wait for updates to complete.
 * @param reactiveElementTimeout - The timeout in milliseconds to wait for the element to finish updates.
 * If `null`, the function will wait indefinitely.
 * @returns A promise that resolves when the element has finished all queued updates.
 * If the timeout is exceeded, the promise will reject with an error.
 *
 * @remarks
 *
 * This function waits for a series of updates to complete on a
 * `ReactiveControllerHost`. It uses the `updateComplete` property
 * to determine when the element has finished its current update cycle.
 * It will continue to wait until the element has no more updates
 * queued in the current or subsequent microtask.
 */
export async function uponElementUpdatesSettled(
  host: UpdatableHost,
  reactiveElementTimeout: number | null,
): Promise<void> {
  // Wait one microtask before starting the timeout. This ensures all
  // initial updates are requested before waiting for them to complete.
  //
  // For example, `KnytElement` makes all side effects asynchronous, so
  // setting a reactive property is delayed by one microtask. If the
  // timeout starts immediately, it will resolve before the update is
  // requested, causing a false positive.
  await Promise.resolve();

  const abortController = new AbortController();

  function triggerAbort() {
    abortController.abort(
      new Error(
        `Timeout waiting for element to finish updates. Timeout: ${reactiveElementTimeout}ms`,
      ),
    );
  }

  const timeoutId =
    typeof reactiveElementTimeout === "number"
      ? setTimeout(triggerAbort, reactiveElementTimeout)
      : null;

  const abortPromise = new Promise<void>((_, reject) => {
    abortController.signal.addEventListener("abort", () => {
      reject(abortController.signal.reason);
    });
  });

  const startTime = performance.now();

  function shouldContinue() {
    if (reactiveElementTimeout === null) {
      // If the timeout is `null`, we will wait indefinitely
      // for the element to finish updates.
      return true;
    }

    // Flooring the current time allows for microtasks to complete
    // within the current millisecond when the timeout is zero (0).
    const currentTime = Math.floor(performance.now());
    const elapsedTime = currentTime - startTime;

    return elapsedTime <= reactiveElementTimeout;
  }

  while (shouldContinue()) {
    const hasFinishedAllQueuedUpdates = await Promise.race([
      host.updateComplete.then(() => {
        // We check `updateComplete` again to ensure that
        // no updates are requested in response to the
        // previous `updateComplete` resolution.
        //
        // To clarify, `updateComplete` is a promise that resolves
        // when the host has finished the current update cycle.
        // It does not guarantee that no further updates will be
        // immediately requested in response to the
        // previous update cycle's completion.
        return host.updateComplete;
      }),
      abortPromise,
    ]);

    if (hasFinishedAllQueuedUpdates) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      return;
    }
  }

  // If we reach here, it means the timeout was exceeded,
  // before the `abortPromise` was rejected, so we need to
  // simply wait for it to be rejected.
  await abortPromise;
}

export function isUpdatableHost(
  element: unknown,
): element is Element & UpdatableHost {
  return (
    isNonNullableObject(element) &&
    "updateComplete" in element &&
    isPromiseLike(element.updateComplete)
  );
}
