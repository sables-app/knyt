import { GlazierPlugin } from "./GlazierPlugin.ts";

// This module allows for easier integration with Bun's
// static server. The plugin is exposed as a default export,
// which allows Bun to use it without requiring the user
// to import and configure the plugin manually in their
// own module.
//
// This is useful for users who want to use
// the plugin without having to worry about the details
// of configuration and setup.
//
// If the configuration file is not found, the plugin
// will use the default options.

/**
 * The default plugin used by Bun's static server
 * when "@knyt/glazier/plugin" is specified in the
 * `bunfig.toml` file.
 */
export default GlazierPlugin.withConfigFile();
