import { defineConfig, disableDependencyInjection } from "@knyt/glazier";

import { appMode } from "./lib/appMode";

export default defineConfig({
  onRequest(request: Request) {
    appMode.associate(request, process.env.NODE_ENV || "development");
    // disableDependencyInjection(request);
    request.headers.set("x-foo", "bar");
  },
  onConfigureRender() {
    return {
      reactiveElementTimeout: 555,
    };
  },
  render: {},
});
