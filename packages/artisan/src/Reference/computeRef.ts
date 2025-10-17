import { ReferenceCompute } from "./ReferenceCompute.ts";
import type { Reference } from "./types.ts";

/**
 * @internal scope: workspace
 */
export function normalizeComputeReferenceArgs<T, V extends any[]>(
  params: ReferenceCompute.Args<T, V>,
): ReferenceCompute.Options<T, V> {
  if (params.length === 1) {
    const [options] = params as [ReferenceCompute.Options<T, V>];

    return options;
  }

  const dependencies = params.slice(0, -1) as ReferenceCompute.Dependencies<V>;
  const compute = params[params.length - 1] as ReferenceCompute.Compute<T, V>;

  return { dependencies, compute };
}

/**
 * Creates a readonly reference from a computed value
 * based on the given dependencies.
 *
 * @remarks
 *
 * Use `mapRef` to modify the value of a single source reference.
 * For combining values from multiple dependencies, use `computeRef`.
 *
 * Transformed references automatically update when the source reference changes.
 * Updates for computed references are batched within a microtask, which means
 * they may skip intermediate updates and only use the latest values.
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
export function computeRef<T, V extends any[]>(
  options: ReferenceCompute.Options<T, V>,
): Reference.SubscriberRetaining<T>;

export function computeRef<T, V extends any[]>(
  ...params: ReferenceCompute.Params<T, V>
): Reference.SubscriberRetaining<T>;

export function computeRef<T, V extends any[]>(
  ...params: ReferenceCompute.Args<T, V>
): Reference.SubscriberRetaining<T> {
  return new ReferenceCompute(normalizeComputeReferenceArgs(params));
}
