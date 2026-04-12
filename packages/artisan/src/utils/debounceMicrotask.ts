import type { DebouncedFunction } from "../types/mod.ts";

/**
 * Debounces a function to be called on the next microtask.
 *
 * @internal scope: workspace
 */
export function debounceMicrotask<T extends (...args: any[]) => void>(
  fn: T,
): DebouncedFunction<T> {
  let scheduled = false;
  let latestThis: ThisParameterType<T> | undefined;
  let latestArgs: Parameters<T> | undefined;

  const debounced = function (this: any, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    latestThis = this;
    latestArgs = args;

    if (scheduled) return;

    scheduled = true;

    queueMicrotask(() => {
      if (!scheduled) return;

      scheduled = false;

      fn.apply(latestThis!, latestArgs!);
    });
  } as T;

  const cancel = () => {
    scheduled = false;
  };

  const flush = () => {
    if (!scheduled) return;

    scheduled = false;

    fn.apply(latestThis!, latestArgs!);
  };

  return Object.assign(debounced, { cancel, flush });
}
