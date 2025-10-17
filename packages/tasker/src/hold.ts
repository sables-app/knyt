import { ref, type BasicReference, type Reference } from "@knyt/artisan";

import type { ReactiveControllerHost } from "./ReactiveController.ts";
import { track } from "./tracking.ts";

/**
 * Creates a reactive state reference that requests an update
 * on the given host when its value changes.
 */
export function hold<T>(
  host: ReactiveControllerHost,
  initialValue: T,
  arg1?:
    | Reference.UpdateHandler<T>
    | Omit<BasicReference.Options<T>, "initialValue">,
): Reference<T> {
  let options: BasicReference.Options<T>;

  if (typeof arg1 === "function") {
    options = { initialValue, onUpdate: arg1 };
  } else {
    options = { ...arg1, initialValue };
  }

  const state = ref<T>(initialValue, options);

  track(host, state);

  return state;
}
