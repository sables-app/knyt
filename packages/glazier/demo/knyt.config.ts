import { defineConfig, disableDependencyInjection } from "@knyt/glazier";

import { appMode } from "./lib/appMode";

export default defineConfig({
  onRequest(request) {
    appMode.associate(request, import.meta.env.NODE_ENV || "development");
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
