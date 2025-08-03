import { define, dom } from "knyt";
import { defineIncludeOptions } from "@knyt/glazier";

export const options = defineIncludeOptions({
  serverOnly: true,
});

export default define.view(() => {
  // This `src` attribute will be rewritten by the plugin to a path relative
  // to the consuming HTML bundle . Then Bun will import the script for bundling.
  return dom.script.src("./main.ts").type("module");
});
