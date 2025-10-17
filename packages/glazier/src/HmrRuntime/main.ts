import { shouldInitialize } from "./shouldInitialize.ts";
import { stubCustomElementRegistry } from "./stubCustomElementRegistry.ts";
import { suppressHmrErrors } from "./suppressHmrErrors.ts";

if (shouldInitialize()) {
  stubCustomElementRegistry(globalThis.customElements);
  suppressHmrErrors();
}
