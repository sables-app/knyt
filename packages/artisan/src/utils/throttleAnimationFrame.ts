/**
 * Leading-edge throttle function that calls the function
 * at most once per animation frame and guarantees the last
 * call will be applied.
 *
 * @internal scope: workspace
 */
export function throttleAnimationFrame<T extends (...args: any[]) => void>(
  fn: T,
): T {
  /**
   * The last time the function was called.
   */
  let lastTime = 0;
  /**
   * The value of `lastTime` when the last animation frame was requested.
   */
  let animationFrameLastTime = lastTime;
  /**
   * The ID of the animation frame that guarantees the last call.
   */
  let lastCallFrameId: ReturnType<typeof requestAnimationFrame> | undefined;

  return function (this: any, ...args: any[]) {
    const callFn = () => {
      const now = performance.now();

      lastTime = now;

      fn.apply(this, args);

      // This shouldn't be cancelled. It should always complete,
      // so that we can track whether the animation frame has passed.
      requestAnimationFrame(() => {
        animationFrameLastTime = now;
      });
    };

    if (lastCallFrameId) {
      cancelAnimationFrame(lastCallFrameId);
    }

    const hasAnimationFramePassedSinceLastCall =
      lastTime === animationFrameLastTime;

    if (hasAnimationFramePassedSinceLastCall) {
      callFn();
      return;
    }

    lastCallFrameId = requestAnimationFrame(() => {
      callFn();
    });
  } as T;
}
