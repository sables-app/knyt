import { HydratedReferenceController } from "./HydratedReferenceController";

/**
 * Creates a reactive state reference that hydrates
 * when the host is connected to the DOM.
 *
 * @alpha This is an experimental API and WILL change in the future without notice.
 */
export function hydrateRef<T>(
  host: HydratedReferenceController.CompleteHost,
  options: hydrateRef.Options<T>,
): void {
  new HydratedReferenceController<T>(host, options);
}

export namespace hydrateRef {
  // An alias for convenience.
  export type Options<T> = HydratedReferenceController.Options<T>;
}
