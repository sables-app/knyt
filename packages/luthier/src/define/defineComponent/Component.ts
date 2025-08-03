import type {
  AnyProps,
  ElementBuilder,
  KnytDeclaration,
  ViewBuilder,
} from "@knyt/weaver";

import type { PropertiesDefinition } from "../../types";
import type { ComponentController } from "./ComponentController";

/**
 * @deprecated This is an experimental API that will change in the future.
 */
export type Component<P extends AnyProps, E extends Element> = {
  (): ViewBuilder<P, E>;
};

export namespace Component {
  /**
   * Extracts props for a component from its properties definition.
   */
  /*
   * ### Private Remarks
   *
   * `Partial` is necessary here, because `ViewBuilder` enforces
   * that every props be optional; not just possibly `undefined`.
   */
  export type Props<
    PD extends PropertiesDefinition<any>,
    E extends Element,
  > = Partial<PropertiesDefinition.ToProps<PD> & E>;

  /**
   * @internal scope: workspace
   */
  export type FromPropertiesDefinition<
    PD extends PropertiesDefinition<any>,
    E extends Element,
  > = Component<Props<PD, E>, E>;

  export type RendererFn<P extends AnyProps, E extends Element> = (
    this: ComponentController<P, E>,
    payload: RendererPayload<P, E>,
  ) => KnytDeclaration;

  export type RendererPayload<P extends AnyProps, E extends Element> = {
    props: P;
    children?: KnytDeclaration;
    Host: ComponentController.HostFn;
  };

  export type LifecycleFn<P extends AnyProps, E extends Element> = (
    this: ComponentController<P, E>,
    host: ComponentController<P, E>,
  ) => RendererFn<P, E>;

  export type RootInput<E extends Element> = ElementBuilder<E>;
}
