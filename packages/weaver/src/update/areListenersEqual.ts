import { shallowEqual } from "@knyt/artisan";

import type { AnyProps, ListenerDeclaration } from "../types/mod";

/**
 * Determines if two listener declarations are equal.
 *
 * @internal scope: package
 */
export function areListenersEqual<E extends AnyProps = AnyProps>(
  prevListener: ListenerDeclaration<E> | undefined,
  nextListener: ListenerDeclaration<E> | undefined,
): boolean {
  if (prevListener === nextListener) {
    return true;
  }

  if (!prevListener || !nextListener) {
    return false;
  }

  if (
    prevListener.type === nextListener.type &&
    prevListener.handler === nextListener.handler &&
    shallowEqual(prevListener.options, nextListener.options)
  ) {
    return true;
  }

  return false;
}
