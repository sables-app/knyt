import type { AnyProps } from "@knyt/weaver";

import type { PropertiesDefinition } from "../types.ts";

/**
 * A function that can be used to define properties on an `KnytElement`.
 *
 * @public
 *
 * @deprecated This isn't needed anymore. Just use a plain object instead with
 * `satisfies PropertiesDefinition.FromProps<P>`.
 */
// TODO: Consider renaming to `props` for conciseness.
export function defineProperties<P extends AnyProps = AnyProps>() {
  return <PD extends PropertiesDefinition.FromProps<P>>(properties: PD): PD =>
    properties;
}
