/**
 * Debounces a function to be called on the next microtask.
 *
 * @internal scope: workspace
 */
export function debounceMicrotask<T extends (...args: any[]) => void>(
  fn: T,
): T {
  let scheduled = false;
  let latestThis: ThisParameterType<T> | undefined;
  let latestArgs: Parameters<T> | undefined;

  return function (this: any, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    latestThis = this;
    latestArgs = args;

    if (scheduled) return;

    scheduled = true;

    queueMicrotask(() => {
      scheduled = false;

      fn.apply(latestThis!, latestArgs!);
    });
  } as T;
}
