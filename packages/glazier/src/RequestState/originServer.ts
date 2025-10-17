import type { Server } from "bun";

import { createRequestState } from "./RequestState.ts";

/**
 * @internal scope: package
 */
export const originServerState = createRequestState<Server<any> | undefined>(
  undefined,
);

/**
 * Retrieves the server instance that is serving the request.
 */
export function getOriginServer(request: Request): Server<any> | undefined {
  return originServerState.from(request);
}
