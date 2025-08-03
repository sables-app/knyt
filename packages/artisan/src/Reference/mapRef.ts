import { ReferenceMapped } from "./ReferenceMapped";
import type { Reference } from "./types";

/**
 * @internal scope: workspace
 */
export function normalizeReferenceMappedArgs<T, U>(
  params: ReferenceMapped.NonCurryArgs<T, U>,
): ReferenceMapped.Options<T, U> {
  if (params.length === 1) {
    const [options] = params;

    return options;
  }

  const [origin, transform] = params;

  return { origin, transform };
}

/**
 * @internal scope: workspace
 */
export function isReferenceMappedCurryParams<T, U>(
  params: ReferenceMapped.Args<T, U>,
): params is ReferenceMapped.CurryParams<T, U> {
  return params.length === 1 && typeof params[0] === "function";
}

/**
 * Creates a readonly reference by transforming the value
 * of an origin reference.
 *
 * @remarks
 *
 * Use `mapRef` to modify the value of a single origin reference.
 * For combining values from multiple dependencies, use `computeRef`.
 *
 * Mapped references automatically update when the origin reference changes.
 * In contrast, updates for computed references are batched within a microtask,
 * which means they may skip intermediate updates and only use the latest values.
 *
 * @beta
 */
/*
 * ### Private Remarks
 *
 * Overload signatures are used to ensure proper type inference.
 * The `ReferenceMapped.Params` type is too complex for TypeScript
 * to infer correctly without them.
 */
export function mapRef<T, U>(
  options: ReferenceMapped.Options<T, U>,
): Reference.SubscriberRetaining<T, U>;

export function mapRef<T, U>(
  ...params: ReferenceMapped.Params<T, U>
): Reference.SubscriberRetaining<T, U>;

export function mapRef<T, U>(
  ...params: ReferenceMapped.CurryParams<T, U>
): ReferenceMapped.CurriedFn<T, U>;

export function mapRef<T, U>(
  ...params: ReferenceMapped.Args<T, U>
): Reference.SubscriberRetaining<T, U> | ReferenceMapped.CurriedFn<T, U> {
  if (isReferenceMappedCurryParams(params)) {
    return (origin) => {
      const [transform] = params;

      return new ReferenceMapped<T, U>({ origin, transform });
    };
  }

  return new ReferenceMapped<T, U>(normalizeReferenceMappedArgs(params));
}
