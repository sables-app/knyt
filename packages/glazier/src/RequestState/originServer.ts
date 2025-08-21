import type { Server } from "bun";

import { createRequestState } from "./RequestState";

/**
 * @internal scope: package
 */
export const originServerState = createRequestState<Server | undefined>(
  undefined,
);

/**
 * Retrieves the server instance that is serving the request.
 */
export function getOriginServer(request: Request): Server | undefined {
  return originServerState.from(request);
}
