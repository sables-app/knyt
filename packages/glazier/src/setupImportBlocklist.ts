import type { PluginBuilder } from "bun";

function createImportBlocklistFilter() {
  return new RegExp(
    [
      // Exclude all `node:`-prefixed imports.
      "^node:",

      // Exclude all `bun:`-prefixed imports.
      "^bun:",

      // Exclude Node.js built-in modules.
      "^fs$",
      "^path$",
      "^os$",
      "^crypto$",
      "^http$",
      "^https$",
      "^stream$",
      "^util$",
      "^events$",
      "^buffer$",
      "^child_process$",
      "^cluster$",
      "^console$",
      "^constants$",
      "^dgram$",
      "^dns$",
      "^domain$",
      "^net$",
      "^process$",
      "^punycode$",
      "^querystring$",
      "^readline$",
      "^repl$",
      "^string_decoder$",
      "^timers$",
      "^tls$",
      "^tty$",
      "^url$",
      "^v8$",
      "^vm$",
      "^zlib$",
      "^assert$",
      "^module$",
      "^perf_hooks$",
      "^inspector$",
      "^worker_threads$",
      "^async_hooks$",
      "^http2$",
      "^fs/promises$",
      "^path/posix$",
      "^path/win32$",
    ].join("|"),
  );
}

/**
 * Setup a blocklist for certain imports that should not be bundled.
 *
 * @remarks
 *
 * This is useful for excluding Node.js built-in modules and other
 * modules that are not meant to be bundled in a browser environment.
 *
 * This currently only issues warnings when such imports are encountered,
 * but in the future, it could be configured to throw errors.
 *
 * TODO: Consider making this configurable.
 *
 * @param builder - The Bun plugin builder to configure.
 */
export function setupImportBlocklist(builder: PluginBuilder): void {
  const filter = createImportBlocklistFilter();

  builder.onResolve({ filter }, ({ path: inputPath }) => {
    console.error(
      `[GlazierPlugin] Unexpected import: "${inputPath}". This is likely a mistake, as this module is not typically bundled for browser environments.`,
    );

    return null;
  });
}
