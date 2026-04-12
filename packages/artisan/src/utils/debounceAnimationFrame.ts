import type { DebouncedFunction } from "../types/utils.ts";

/**
 * Debounces a function to be called on the next animation frame.
 *
 * @internal scope: workspace
 */
export function debounceAnimationFrame<T extends (...args: any[]) => void>(
  fn: T,
): DebouncedFunction<T> {
  let frameId: number | undefined;
  let latestThis: ThisParameterType<T> | undefined;
  let latestArgs: Parameters<T> | undefined;

  const debounced = function (this: any, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    latestThis = this;
    latestArgs = args;

    if (frameId !== undefined) {
      cancelAnimationFrame(frameId);
    }

    frameId = requestAnimationFrame(() => {
      frameId = undefined;
      fn.apply(latestThis!, latestArgs!);
    });
  } as T;

  const cancel = () => {
    if (frameId !== undefined) {
      cancelAnimationFrame(frameId);
      frameId = undefined;
    }
  };

  const flush = () => {
    if (frameId !== undefined) {
      cancelAnimationFrame(frameId);
      frameId = undefined;
      fn.apply(latestThis!, latestArgs!);
    }
  };

  return Object.assign(debounced, { cancel, flush });
}
