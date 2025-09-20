import { createRequestState, type AnyRequest } from "@knyt/glazier";

export const appMode = createRequestState("development");

export function isDevelopment(request: AnyRequest) {
  return appMode.from(request) === "development";
}
