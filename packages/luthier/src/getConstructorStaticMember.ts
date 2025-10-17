import type { PropertyName } from "./types.ts";

function getConstructor<T = unknown>(obj: unknown): T | Error {
  const constructor = Object.getPrototypeOf(obj).constructor as unknown;

  if (constructor == null) {
    return new Error("Constructor not found.");
  }

  return constructor as T;
}

/**
 * @internal scope: package
 */
export function getConstructorStaticMember<
  T = unknown,
  P extends PropertyName = string,
>(obj: unknown, propertyName: P): T | Error {
  const constructor = getConstructor<Record<P, T>>(obj);

  if (constructor instanceof Error) {
    return constructor;
  }

  if (!Object.hasOwn(constructor, propertyName)) {
    return new Error(
      `Property ${String(propertyName)} not found on constructor.`,
    );
  }

  return constructor[propertyName];
}
