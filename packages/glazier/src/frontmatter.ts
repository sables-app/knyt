import { createRequestState } from "./RequestState";

export namespace Frontmatter {
  export type Any = Partial<Record<string, any>>;
  export type Unknown = Record<string, unknown>;
}

/**
 * @internal scope: package
 */
export const frontmatterState = createRequestState<Frontmatter.Any>({});

export function getFrontmatter<T extends Frontmatter.Any = Frontmatter.Unknown>(
  request: Request,
): T {
  return frontmatterState.from(request) as T;
}
