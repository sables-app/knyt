import { shouldInitialize } from "./shouldInitialize";
import { stubCustomElementRegistry } from "./stubCustomElementRegistry";
import { suppressHmrErrors } from "./suppressHmrErrors";

if (shouldInitialize()) {
  stubCustomElementRegistry(globalThis.customElements);
  suppressHmrErrors();
}
