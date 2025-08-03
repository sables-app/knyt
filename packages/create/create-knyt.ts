// This module serves as the entry point for the CLI tool
// It imports the main CLI function and executes it, handling any errors that may occur.
// This files is bundled into a single file for distribution at `bin/create-knyt.bundle.js`

import { runCli } from "./src/main";

runCli().catch((error) => {
  console.error("An unknown error occurred while running the CLI:");
  console.error(error);
  process.exit(1);
});
