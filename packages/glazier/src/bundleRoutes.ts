/// <reference types="bun-types" />

import fs from "node:fs/promises";
import path from "node:path";

import type { BuildConfig, BunPlugin, HTMLBundle } from "bun";

import { getKnytBatchSize, isCIEnv, isProductionSSREnv } from "./env";
import { getServeStaticPlugins } from "./getServeStaticPlugins";
import glazierPlugin from "./plugin";
import { rewriteRelativeResourceTags } from "./rewriteRelativeResourceTags";

/** @internal */
const BUILD_DIR_NAME = ".knyt-build";
/** @internal */
const ROOT_DIR_NAME = "__root__";

function isHTMLEntryPoint(artifact: Bun.BuildArtifact): boolean {
  return artifact.kind === "entry-point" && artifact.path.endsWith(".html");
}

/**
 * Represents the result of building a route.
 *
 * @public
 */
export type RouteBuildResult = {
  /**
   * The build output for the route.
   */
  buildOutput: Bun.BuildOutput;
  /**
   * An absolute path to the entrypoint HTML file.
   *
   * @example "/path/to/src/entrypoint.html"
   */
  entrypoint: string;
  /**
   * The route path.
   *
   * @example "/" or "/about"
   */
  route: string;
  /**
   * The directory where the route was built.
   *
   * @example "/path/to/dist/.knyt-build" or "/path/to/dist/.knyt-build/about"
   */
  routeBuildDir: string;
};

/**
 * Options for building routes.
 *
 * @public
 */
export type BuildRoutesOptions = {
  /**
   * The directory where the built assets will be placed.
   *
   * @defaultValue "./assets"
   *
   * @remarks
   *
   * This is the root directory for the built HTML files and assets.
   * It should be a path relative to the directory defined by the `distDir` option.
   * If the directory does not exist, it will be created.
   */
  assetsDir?: string;
  /**
   * The prefix to use for the assets paths in the built HTML files.
   *
   * @defaultValue `"/assets"`
   *
   * @remarks
   *
   * This is used to rewrite relative resource tags in the HTML files.
   * It should match the path where the assets will be served from.
   *
   * @example
   *
   * "/assets" - for local development
   * "https://cdn.example.com/assets" - for production CDN
   */
  assetsPrefix?: string;
  /**
   * The number of routes to build in parallel.
   *
   * @defaultValue `4`
   */
  batchSize?: number;
  /**
   * Whether to clean the build directory after building.
   *
   * @defaultValue `true`
   */
  cleanBuildDir?: boolean;
  /**
   * Whether to clean the output directory before building.
   *
   * @defaultValue `true`
   */
  cleanOutputDir?: boolean;
  /**
   * A function to configure the build process for each route.
   *
   * @defaultValue A no-op function that returns the provided build configuration unmodified.
   */
  configure?: (
    buildConfig: BuildConfig,
    context: {
      /**
       * The route path being built.
       */
      route: string;
    },
  ) => BuildConfig | Promise<BuildConfig>;
  /**
   * Whether to copy the favicon to the root directory.
   *
   * @defaultValue `true`
   *
   * @remarks
   *
   * If set to true, the build process will attempt to detect a favicon in the assets
   * and copy it to the root directory of the built output.
   * This is useful for ensuring that the favicon is available at the root path
   * (e.g., `/favicon.ico`) for browsers to find it.
   */
  copyFavicon?: boolean;
  /**
   * The directory where the built routes will be placed.
   *
   * @defaultValue `"./dist"`
   *
   * @remarks
   *
   * This is the root directory for the built HTML files and assets.
   * It should be an absolute path or a path relative to the current working directory.
   * If the directory does not exist, it will be created.
   */
  distDir?: string;
  /**
   * Whether to overwrite duplicate assets when building each route.
   *
   * @defaultValue `false`
   */
  overwriteDuplicateAssets?: boolean;
  /**
   * Whether to log verbose output during the build process.
   *
   * @defaultValue `false`
   */
  verbose?: boolean;
};

type RouteBuildEntry = {
  route: string;
  entrypoint: string;
};

const defaultConfigure = (buildConfig: BuildConfig): BuildConfig => {
  // Default configuration does not modify the build config.
  return buildConfig;
};

/**
 * The routes to build.
 *
 * @remarks
 *
 * This should be an object where the keys are the route paths and the values are the HTML bundles.
 */
export type BuildRoutesInput = Record<string, HTMLBundle>;

/**
 * Bundles the specified routes into static HTML files and assets.
 *
 * @param routes - An object where the keys are route paths and the values are HTML bundles.
 * @param options - Optional configuration for the build process.
 */
// Builds the routes by processing each HTML entrypoint and rewriting
// relative resource tags to absolute paths based on the provided options.
export async function bundleRoutes(
  routes: BuildRoutesInput,
  options: BuildRoutesOptions = {},
): Promise<RouteBuildResult[]> {
  const isProd = isProductionSSREnv();

  console.info(`[glazier] Building ...`);

  const {
    assetsDir = "./assets",
    assetsPrefix = "/assets",
    batchSize = getDefaultBatchSize(),
    cleanBuildDir = true,
    cleanOutputDir = true,
    configure = defaultConfigure,
    copyFavicon = true,
    distDir = "./dist",
    overwriteDuplicateAssets = false,
    verbose = false,
  } = options;

  const cwd = process.cwd();
  const outdir = path.resolve(cwd, distDir);
  const buildDir = path.resolve(outdir, BUILD_DIR_NAME);

  // Delete the output directory before building
  if (cleanOutputDir) {
    await fs.rm(outdir, { recursive: true, force: true });
  }

  const buildOutputs: RouteBuildResult[] = [];

  // We're going to build each route separately, because
  // 1) Bun's bundler doesn't support multiple HTML entrypoints well.
  // 2) Bun Bake (`bun build --app`) is not yet stable enough for use;
  // alpha state at the time of writing;
  //
  // Building each route separately allows us to have more control
  // over the build process and to handle each route's output individually.
  //
  // This is neither the most efficient way to build multiple routes,
  // nor results in the fewest number of output files, but it is the
  // most reliable way to ensure that each route is built correctly.
  //
  // TODO: Revisit this approach as Bun's feature set evolves.

  async function buildHTMLBundleRoute({ route, entrypoint }: RouteBuildEntry) {
    const routeBuildDir = path.resolve(
      buildDir,
      route === "/" ? ROOT_DIR_NAME : route.substring(1),
    );

    const buildConfig: BuildConfig = {
      entrypoints: [entrypoint],
      minify: isProd,
      outdir: routeBuildDir,
      plugins: await getBuildPlugins(),
      sourcemap: isProd ? false : "inline",
    };

    const buildOutput = await Bun.build(
      await configure(buildConfig, { route }),
    );

    if (buildOutput.success === false) {
      console.error(
        `[glazier] Build failed for route ${route} from ${entrypoint}`,
      );

      return;
    }

    const { outputs } = buildOutput;

    buildOutputs.push({
      buildOutput,
      entrypoint,
      route,
      routeBuildDir,
    });

    const resourceBaseNames = outputs
      .filter((output) => !isHTMLEntryPoint(output))
      .map((output) => path.parse(output.path).base);

    async function finalizeHTMLEntryPoint(output: Bun.BuildArtifact) {
      const htmlString = rewriteRelativeResourceTags(
        await output.text(),
        resourceBaseNames,
        assetsPrefix,
      );
      const finalFilePath =
        route === "/"
          ? path.resolve(outdir, `index.html`)
          : path.resolve(outdir, `${route.slice(1)}.html`);

      await Bun.write(finalFilePath, htmlString);
    }

    async function finalizeAsset(output: Bun.BuildArtifact) {
      const finalFilePath = path.resolve(
        outdir,
        assetsDir,
        path.parse(output.path).base,
      );

      const finalFile = Bun.file(finalFilePath);

      if ((await finalFile.exists()) && !overwriteDuplicateAssets) {
        // Skip if the file already exists, because if the build
        // should generate files with unique names based on content,
        // so if the file exists, it means it was already built, and
        // we can skip writing it again.
        return;
      }

      if (!(await Bun.file(output.path).exists())) {
        if (verbose) {
          console.warn(
            `[glazier] Output file ${output.path} does not exist, skipping write.`,
          );
        }
        return;
      }

      if (verbose) {
        console.info(
          `[glazier] Finalizing asset ${output.path} to ${finalFilePath}`,
        );
      }

      await Bun.write(
        finalFile,
        // Passing a `BunFile` directly to `Bun.write` does not work here.
        // Instead, read the file contents into memory and write the bytes to the file.
        // TODO: Change this to a stream to avoid loading the entire file into memory.
        await Bun.file(output.path).bytes(),
      );

      // Handle special case for favicon.
      if (copyFavicon && isFaviconPath(output.path)) {
        // If the output is a favicon, we also need to copy it to the root directory.
        const rootFaviconPath = path.resolve(outdir, "favicon.ico");

        // TODO: Change this to a stream to avoid loading the entire file into memory.
        await Bun.write(rootFaviconPath, await Bun.file(output.path).bytes());
      }
    }

    for (const output of outputs) {
      if (isHTMLEntryPoint(output)) {
        await finalizeHTMLEntryPoint(output);
      } else {
        await finalizeAsset(output);
      }
    }
  }

  /**
   * Resolves upon a route build completes.
   * After all routes are built, the promise will resolve, and new promises will be created.
   */
  let routeBuildComplete = Promise.withResolvers<void>();

  /**
   * An array of promises for each route build.
   * This is used to keep track of the builds and to wait for them to complete.
   */
  const routeBuilds: Promise<void>[] = [];

  let activeBuilds = 0;

  async function startRouteBuild(buildProcess: () => Promise<void>) {
    activeBuilds++;

    await buildProcess();

    activeBuilds--;

    routeBuildComplete.resolve();
    routeBuildComplete = Promise.withResolvers<void>();
  }

  async function startHTMLBundleRouteBuild(entry: RouteBuildEntry) {
    await startRouteBuild(async () => {
      try {
        await buildHTMLBundleRoute(entry);
      } catch (error) {
        console.error(
          `[glazier] Error building route ${entry.route} from ${entry.entrypoint}:`,
          error,
        );
      }
    });
  }

  for (const [route, source] of Object.entries(routes)) {
    if (activeBuilds >= batchSize) {
      await routeBuildComplete.promise;
    }

    const routeBuild = startHTMLBundleRouteBuild({
      route,
      entrypoint: source.index,
    });

    routeBuilds.push(routeBuild);
  }

  // Wait for all builds to complete
  await Promise.all(routeBuilds);

  // Clean up the build directory after the entire build is complete
  if (cleanBuildDir) {
    await fs.rm(buildDir, { recursive: true, force: true });
  }

  console.info(`[glazier] Build complete!`);

  return buildOutputs;
}

async function getBuildPlugins(): Promise<BunPlugin[]> {
  const serveStaticPlugins = await getServeStaticPlugins();

  if (!serveStaticPlugins) {
    // If no plugins are configured in bunfig.toml,
    // we return the glazier plugin only.
    return [glazierPlugin];
  }

  return serveStaticPlugins;
}

function getDefaultBatchSize() {
  if (isCIEnv()) {
    // In CI environments, we default to 1 to avoid overwhelming the system.
    return 1;
  }

  return getKnytBatchSize();
}

function isFaviconPath(filePath: string): boolean {
  const basename = path.basename(filePath).toLowerCase();

  return basename.startsWith("favicon") && basename.endsWith(".ico");
}
