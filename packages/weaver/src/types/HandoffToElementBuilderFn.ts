import type { AnyProps, ElementDeclaration } from "./core.ts";
import type { ElementBuilder } from "./ElementBuilder.ts";

// TODO: Rename to `UpdateElementDeclarationFn` for clarity.
export type HandoffToElementBuilderFn<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
> = (
  mutateElementDeclaration: (
    nextElementDeclaration: ElementDeclaration<P, E>,
  ) => void,
) => ElementBuilder<P, E>;
