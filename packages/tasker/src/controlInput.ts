import { InputStateController } from "./InputStateController.ts";
import type { ReactiveControllerHost } from "./ReactiveController.ts";

/**
 * Creates a controller that manages the state of an input element.
 *
 * @beta This is a beta feature and may change in the future.
 */
// TODO Add documentation for this function.
export function controlInput<
  T,
  E extends Element & { value: string } = HTMLInputElement,
>(
  host: ReactiveControllerHost,
  options: InputStateController.Options<T>,
): InputStateController<T, E> {
  return new InputStateController(host, options);
}
