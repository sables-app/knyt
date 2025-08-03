# `NODE_ENV=production` is required to disable Bun's
#development mode to avoid issues with HMR.
# We'll have to use `--watch` with manual reloads for now.
# Related: https://github.com/oven-sh/bun/issues/19329
# TODO: Remove this when Bun fixes the issue.
NODE_ENV=production bun ./content/index.html
