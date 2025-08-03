import { isPromiseLike, isUnknownDictionary } from "@knyt/artisan";

export type PartialPromise<T> = {
  [K in keyof T]: T[K] | PromiseLike<T[K]>;
};

export namespace PartialPromise {
  export type Awaited<T> =
    T extends PartialPromise<infer U> ? Promise<U> : never;
}

function hasPromises<T>(value: PartialPromise<T>): boolean {
  if (!isUnknownDictionary(value)) {
    return false;
  }

  for (const key in value) {
    const propertyValue = value[key];

    if (isPromiseLike(propertyValue)) {
      return true;
    }
  }

  return false;
}

export function resolvePartialPromise<T extends PartialPromise<any>>(
  obj: T,
): Promise<PartialPromise.Awaited<T>> | PartialPromise.Awaited<T> {
  return hasPromises(obj)
    ? _resolvePartialPromise(obj)
    : (obj as unknown as PartialPromise.Awaited<T>);
}

/**
 * @internal scope: package
 */
async function _resolvePartialPromise<T extends PartialPromise<any>>(
  props: T,
): Promise<PartialPromise.Awaited<T>> {
  const awaitedRecord = Object.fromEntries(
    await Promise.all(
      Object.entries(props).map(async ([key, value]) => {
        let awaitedValue: unknown;

        if (isPromiseLike(value)) {
          awaitedValue = await value;
        } else {
          awaitedValue = value;
        }

        return [key, awaitedValue];
      }),
    ),
  ) as PartialPromise.Awaited<T>;

  return awaitedRecord;
}
