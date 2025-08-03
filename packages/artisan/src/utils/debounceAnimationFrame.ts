/**
 * Debounces a function to be called on the next animation frame.
 *
 * @internal scope: workspace
 */
export function debounceAnimationFrame<T extends (...args: any[]) => void>(
  fn: T,
): T {
  let frameId: number | undefined;

  return function (this: any, ...args: any[]) {
    if (frameId !== undefined) {
      cancelAnimationFrame(frameId);
    }

    frameId = requestAnimationFrame(() => {
      fn.apply(this, args);

      frameId = undefined;
    });
  } as T;
}
