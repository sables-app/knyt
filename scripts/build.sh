#!/usr/bin/env bash

# TODO: Consider using Jake for building instead of a custom script.

# Build the individual libraries first
bun run build:js:force
bun run --filter @knyt/luthier build

# Then build the toolkit, which depends on the other libraries
bun run --filter knyt build

# Finally, build the create-knyt CLI tool
# This should be the last step to ensure all dependencies are built
# and available for the CLI tool to use.
bun run --filter create-knyt build
