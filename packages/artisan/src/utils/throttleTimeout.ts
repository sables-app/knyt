/**
 * Leading-edge throttle function that calls the function
 * at most once per the specified time and guarantees the last
 * call will be applied.
 *
 * @internal scope: workspace
 */
export function throttleTimeout<T extends (...args: any[]) => void>(
  fn: T,
  wait: number,
): T {
  let lastTime = 0;
  let timeout: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: any[]) {
    const now = performance.now();

    clearTimeout(timeout);

    if (now - lastTime >= wait) {
      lastTime = now;

      fn.apply(this, args);
      return;
    }

    const timeoutWait = wait - (now - lastTime);

    timeout = setTimeout(() => {
      lastTime = performance.now();

      fn.apply(this, args);
    }, timeoutWait);
  } as T;
}
