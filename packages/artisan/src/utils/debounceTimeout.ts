import type { DebouncedFunction } from "../types/mod.ts";

/**
 * Debounce a function to only run after a certain amount of time has passed
 * since the last time it was called. The timer resets every time the function
 * is called.
 *
 * @internal scope: workspace
 */
export function debounceTimeout<T extends (...args: any[]) => void>(
  fn: T,
  wait: number,
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let latestThis: ThisParameterType<T> | undefined;
  let latestArgs: Parameters<T> | undefined;

  const debounced = function (this: any, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    latestThis = this;
    latestArgs = args;

    if (timeout !== undefined) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = undefined;
      fn.apply(latestThis!, latestArgs!);
    }, wait);
  } as T;

  const cancel = () => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  const flush = () => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
      fn.apply(latestThis!, latestArgs!);
    }
  };

  return Object.assign(debounced, { cancel, flush });
}
