import type { AnyProps, ElementDeclaration } from "./core";
import type { ElementBuilder } from "./ElementBuilder";

// TODO: Rename to `UpdateElementDeclarationFn` for clarity.
export type HandoffToElementBuilderFn<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
> = (
  mutateElementDeclaration: (
    nextElementDeclaration: ElementDeclaration<P, E>,
  ) => void,
) => ElementBuilder<P, E>;
