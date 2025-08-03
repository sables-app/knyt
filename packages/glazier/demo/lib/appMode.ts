import { createRequestState } from "@knyt/glazier";

export const appMode = createRequestState("development");

export function isDevelopment(request: Request) {
  return appMode.from(request) === "development";
}
