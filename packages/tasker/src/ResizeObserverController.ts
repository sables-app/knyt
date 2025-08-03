import {
  computeRef,
  ensureReference,
  type Reference,
} from "@knyt/artisan";

import { HostMonitor } from "./HostMonitor";
import type {
  ReactiveController,
  ReactiveControllerHost,
} from "./ReactiveController";
import { track } from "./tracking";

type Options = {
  disabled?: boolean;
  onResize?: () => void;
  target: Reference.Maybe<HTMLElement>;
};

/**
 * @remarks
 *
 * This controller should be added before the host is connected.
 */
export class ResizeObserverController implements ReactiveController {
  #host: ReactiveControllerHost;
  #hostMonitor: HostMonitor;

  #disabled = false;
  #onResize?: ResizeObserverCallback;

  readonly #target$: Reference.Readonly<HTMLElement | null>;
  readonly #resizeObserver$: Reference.Readonly<ResizeObserver | null>;

  readonly #targetWithResizeObserver$: Reference.Readonly<
    [HTMLElement, ResizeObserver] | undefined
  >;

  constructor(
    host: ReactiveControllerHost,
    { disabled, onResize, target }: Options,
  ) {
    this.#disabled = disabled ?? false;
    this.#host = host;
    this.#onResize = onResize;
    this.#target$ = ensureReference(target);

    this.#hostMonitor = new HostMonitor(host);

    this.#resizeObserver$ = computeRef({
      dependencies: [this.#target$, this.#hostMonitor.isHostConnected$],
      compute: (target, isHostConnected) => {
        if (!isHostConnected) return null;

        const ResizeObserverConstructor =
          target?.ownerDocument.defaultView?.ResizeObserver;

        if (!ResizeObserverConstructor) return null;

        return new ResizeObserverConstructor(this.#handleResize);
      },
      onUpdate: (_currentValue, previousValue) => {
        if (previousValue) {
          previousValue.disconnect();
        }
      },
    });

    this.#targetWithResizeObserver$ = computeRef({
      dependencies: [this.#target$, this.#resizeObserver$],
      compute: (target, resizeObserver) => {
        if (!target || !resizeObserver) {
          return undefined;
        }

        return [target, resizeObserver] as const;
      },
      onUpdate: (currentParams, previousParams) => {
        if (previousParams) {
          const [target, resizeObserver] = previousParams;

          resizeObserver.unobserve(target);
        }
        if (currentParams) {
          const [target, resizeObserver] = currentParams;

          resizeObserver.observe(target);
        }
      },
    });

    track(host, this.#targetWithResizeObserver$);
    host.addController(this);
  }

  hostConnected?: () => void;

  #handleResize: ResizeObserverCallback = (...args) => {
    if (this.#disabled) return;

    this.#onResize?.(...args);
  };
}
