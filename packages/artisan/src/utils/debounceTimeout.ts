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
): T {
  let timeout: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: any[]) {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, wait);
  } as T;
}
