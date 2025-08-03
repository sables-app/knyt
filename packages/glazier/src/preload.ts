import { registerGlobals } from "./domEnv";

// This file is used to preload minimal globals for `GlazierPlugin`
// to function in Bun. Globals can be unregistered by calling
// `unregisterGlobals()`.

await registerGlobals();
