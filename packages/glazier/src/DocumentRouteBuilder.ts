import { mkdir, rm, watch } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  BufferedObservable,
  MappedObservable,
  SubscriptionRegistry,
  type Observer,
  type Subscription,
} from "@knyt/artisan";

import { dependencyChanges, type DependencyChange } from "./dependencyChanges";
import { FilesWatcher } from "./FilesWatcher/mod";
import { getTempDir } from "./getTempDir";
import { KnytTagName } from "./importTags";
import { default as glazierPlugin } from "./plugin";
import { routePathState } from "./RequestState/mod";
import {
  assertBunHTMLBundleModule,
  prepareHtmlForTransformation,
  type BunHTMLBundleModule,
} from "./transform/utils";
import type { BunKnytConfig } from "./types";

/**
 * A mapping of route pathnames to their corresponding HTML bundles.
 */
type Routes = Record<RoutePathname, Bun.HTMLBundle>;

// TODO: Consider adding support for an absolute path to the template.
type PageTemplate = PageTemplate.Renderer | Promise<BunHTMLBundleModule>;

namespace PageTemplate {
  export type Renderer = (payload: {
    /**
     * The absolute path to the main content to be included.
     */
    includePath: string;
    /**
     * An `<knyt-include>` tag that includes the main content.
     */
    includeTag: string;
  }) => string | Promise<string>;
}

/**
 * A path to a document.
 *
 * @remarks
 *
 * This can be either a module path or an absolute path.
 * Both are resolved and imported by Bun.
 * Relative paths aren't supported.
 *
 * @example "package-name/docs/getting-started.mdx"
 * @example "/absolute/path/to/docs/getting-started.mdx"
 */
// * @example "C:\\absolute\\path\\to\\docs\\getting-started.mdx"
// TODO: Experiment on Windows/NTFS support? (eww just use WSL)
type DocumentPath = string;

/**
 * An absolute path to a resolved document.
 *
 * @example "/absolute/path/to/docs/getting-started.mdx"
 */
type ResolvedDocumentPath = string;

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname}
 *
 * @example "/getting-started"
 * @example "/"
 */
type RoutePathname = `/${string}`;

/**
 * The root path for the documents.
 *
 * @example "package-name/docs"
 * @example "/absolute/path/to/docs"
 */
// * @example "C:\\absolute\\path\\to\\docs"
// TODO: Experiment on Windows/NTFS support? (eww just use WSL)
type DocumentRootPath = string;

/**
 * An absolute path to the generated HTML file.
 */
type DocumentHTMLPath = `${string}.html`;

export type RouteDocument = {
  path: DocumentPath;
  resolvedPath: ResolvedDocumentPath;
  route: RoutePathname;
  htmlPath: DocumentHTMLPath;
};

/**
 * Generates a unique salt for the temporary directory based on the
 * page template. This ensures that each page template uses a distinct
 * temporary directory.
 */
async function optionsToTempDirSalt(
  original: DocumentRouteBuilder.Options,
): Promise<string> {
  if (typeof original.pageTemplate === "function") {
    return "";
  }

  return (await original.pageTemplate).default.index.toString();
}

async function resolveOptions(
  original: DocumentRouteBuilder.Options,
): Promise<DocumentRouteBuilder.Options.Resolved> {
  const salt = await optionsToTempDirSalt(original);
  const dest = original.dest ?? (await getTempDir(salt));
  const documentRoot =
    original.documentRoot ?? findRootPath(original.documents);
  const fresh = original.fresh ?? false;
  const documentPathToRoutePathname =
    original.documentPathToRoutePathname ??
    ((documentPath: DocumentPath): RoutePathname => {
      return generateRoutePathname(documentRoot, documentPath);
    });
  const development =
    original.development ?? import.meta.env.NODE_ENV !== "production";

  // Log the destination directory if it wasn't explicitly provided.
  if (!original.dest) {
    const cwd = process.cwd();
    const relativeDest = dest.startsWith(cwd) ? path.relative(cwd, dest) : dest;

    console.info(`[glazier] destination directory: ${relativeDest}`);
  }

  return {
    ...original,
    dest,
    development,
    documentRoot,
    fresh,
    documentPathToRoutePathname,
  };
}

/**
 * Builds a mapping of route paths to generated HTML files from the given
 * documents and page template.
 *
 * @remarks
 *
 * This class helps with static site generation by converting document
 * paths into route paths and generating HTML files using a page template.
 *
 * It is intended for use with either `bundleRoutes()` to bundle the routes,
 *  or `Bun.serve()` to serve bundled routes via
 * [Bun's built-in static server](https://bun.sh/docs/bundler/html).
 *
 * @beta This API is experimental and may change.
 */
export class DocumentRouteBuilder {
  /**
   * Resolved options for the builder.
   */
  #options: Promise<DocumentRouteBuilder.Options.Resolved>;
  /**
   * A subscription to the request events from the default glazier plugin.
   */
  #requestSubscription: Subscription;
  /**
   * A promise that resolves to the generated route documents.
   */
  #routeDocuments: Promise<readonly RouteDocument[]>;

  constructor(options: DocumentRouteBuilder.Options) {
    this.#options = resolveOptions(options);
    this.#routeDocuments = this.#options.then(createRouteDocuments);

    // By default, listen to the default plugin
    // TODO: Add option to listen to a given plugin instead of the default one.
    this.#requestSubscription = glazierPlugin.onRequest(this.#handleRequest);
  }

  destroy(): void {
    this.#requestSubscription.unsubscribe();
  }

  #result = new Deferred<GenerateRoutesResult>();

  async #initializeRoutes(): Promise<GenerateRoutesResult> {
    const options = await this.#options;

    if (options.fresh) {
      await cleanDestDir(options.dest);
    }

    const result = await generateRoutes({
      ...options,
      routeDocuments: await this.#routeDocuments,
    });

    // If we're in development mode, watch the documents
    // for changes and regenerate the routes.
    if (options.development) {
      await this.#startWatching();
    }

    return result;
  }

  /**
   * Returns the generated routes, generating them on the first call.
   *
   * @remarks
   *
   * On the first invocation, this method generates and caches the routes.
   * Subsequent calls return the cached result without regenerating.
   *
   * In development mode, this also starts watching documents for changes
   * and will regenerate routes as needed.
   */
  getRoutes(): Promise<
    // This needs to use `any` because Bun uses a generic to infer route information
    // but generated routes are not typed.
    // TODO: Revisit this to see if we can avoid `any`.
    Record<string, any>
  > {
    if (!this.#result.isFulfilled) {
      // NOTE: This shouldn't be awaited here, because this function
      // may be called multiple times, and we only want to generate
      // the routes once.
      this.#result.resolve(this.#initializeRoutes());
    }

    return this.#result.promise.then((result) => result.routes);
  }

  #subscriptions?: SubscriptionRegistry;
  #dependencyChangeBuffer$?: BufferedObservable<DependencyChange>;
  #documentWatcher$?: FilesWatcher;

  #dependencyChangeBufferObserver: Observer<DependencyChange[]> = {
    next: async (changes) => {
      const routeDocuments = await this.#routeDocuments;
      const affectedDocuments: RouteDocument[] = [];

      for (const change of changes) {
        const { entrypointPath } = change;

        for (const routeDocument of routeDocuments) {
          if (
            routeDocument.path === entrypointPath ||
            routeDocument.resolvedPath === entrypointPath ||
            routeDocument.htmlPath === entrypointPath
          ) {
            affectedDocuments.push(routeDocument);
          }
        }
      }

      if (affectedDocuments.length === 0) return;

      const documentsToRegenerate = Array.from(affectedDocuments);

      console.info(
        `[glazier] regenerating route for documents: ${documentsToRegenerate}`,
      );

      await generateRoutes({
        ...(await this.#options),
        routeDocuments: documentsToRegenerate,
        force: true,
      });
    },
    complete: () => {
      console.info(`[glazier] document watcher stopped.`);
    },
    error: (error: unknown) => {
      console.error(`[glazier] error watching document`, error);
    },
  };

  #documentChanges$?: MappedObservable<string, DependencyChange>;

  async #startWatching(): Promise<void> {
    console.info(`[glazier] watching documents for changes...`);

    const { documents } = await this.#options;

    // Watch the documents for changes
    this.#documentWatcher$ = new FilesWatcher(documents);
    // Map file change events to dependency changes
    this.#documentChanges$ = new MappedObservable<string, DependencyChange>(
      (documentPath) => ({
        entrypointPath: documentPath,
        dependencyModulePath: documentPath,
      }),
    );
    // Buffer dependency change events to avoid rapid successive regenerations
    this.#dependencyChangeBuffer$ = new BufferedObservable<DependencyChange>(
      10,
    );

    // Capture subscriptions to clean up on exit
    this.#subscriptions = new SubscriptionRegistry([
      // Connect the document watcher to the document changes mapper
      this.#documentWatcher$.subscribe(this.#documentChanges$),
      // Connect the dependency changes to the buffer observer
      dependencyChanges.beacon.subscribe(this.#dependencyChangeBuffer$),
      // Connect the document changes to the buffer observer
      this.#documentChanges$.subscribe(this.#dependencyChangeBuffer$),
      // Connect the buffer to the buffer observer to handle regenerations
      this.#dependencyChangeBuffer$.subscribe(
        this.#dependencyChangeBufferObserver,
      ),
    ]);

    process.on("SIGINT", () => {
      console.info(`[glazier] stopping document watcher...`);

      this.#subscriptions?.unsubscribeAll();

      this.#documentWatcher$?.complete();
      this.#documentChanges$?.complete();
      this.#dependencyChangeBuffer$?.complete();

      this.#documentWatcher$ = undefined;
      this.#documentChanges$ = undefined;
      this.#dependencyChangeBuffer$ = undefined;

      process.exit(0);
    });
  }

  #handleRequest: BunKnytConfig.OnRequest = async (request): Promise<void> => {
    const resolvedOptions = await this.#options;
    const urlBase = Bun.pathToFileURL(resolvedOptions.dest).toString();
    const routePath = request.url
      .slice(urlBase.length)
      .replace(/(\/index)?\.html$/, "");
    const resolveRoutePath = routePath === "" ? "/" : routePath;

    routePathState.associate(request, resolveRoutePath);
  };
}

export namespace DocumentRouteBuilder {
  /**
   * Options for configuring the `DocumentRouteBuilder`.
   *
   * @public
   */
  export type Options = {
    /**
     * Whether to enable development mode.
     *
     * @remarks
     *
     * When enabled, the server will automatically regenerate a route's HTML file
     * when the corresponding document changes.
     */
    development?: boolean;
    /**
     * The destination path for the generated routes.
     *
     * @remarks
     *
     * This is the path where the generated HTML files will be saved.
     * If not provided, a temporary directory will be used.
     *
     * @defaultValue `.knyt/glazier`
     */
    // TODO: Remove this option whenever HTML bundles can stored in memory as virtual modules.
    dest?: string;
    /**
     * The root file path for the documents used to generate route paths.
     *
     * @remarks
     *
     * If not provided, the root path will be inferred from the common
     * path shared by all documents.
     *
     * @example "package-name/docs"
     * @example "/absolute/path/to/docs"
     * @example "C:\\absolute\\path\\to\\docs"
     */
    documentRoot?: DocumentRootPath;
    /**
     * An array of either module paths or absolute file paths to documents
     * to be converted into routes.
     *
     * @remarks
     *
     * These can be either complete module paths or absolute file paths.
     * Both are resolved and imported by Bun.
     *
     * @example ["package-name/docs/getting-started.mdx"]
     * @example ["/absolute/path/to/docs/getting-started.mdx"]
     */
    documents: DocumentPath[];
    /**
     * The page template to use for generating the routes.
     * This can either be a function or a promise for an HTML import.
     */
    pageTemplate: PageTemplate;
    /**
     * A function that takes a document path and returns a route pathname.
     */
    documentPathToRoutePathname?: (documentPath: DocumentPath) => RoutePathname;
    /**
     * Whether to delete the destination directory before building.
     * If true, the destination directory will be removed before generating routes.
     * Defaults to false.
     */
    fresh?: boolean;
  };

  export namespace Options {
    /**
     * @internal scope: package
     */
    export type Resolved = Required<Options>;
  }
}

function createRouteDocuments(
  options: DocumentRouteBuilder.Options.Resolved,
): RouteDocument[] {
  const cwd = process.cwd();

  return options.documents.reduce<RouteDocument[]>((result, documentPath) => {
    try {
      const routePathname = options.documentPathToRoutePathname(documentPath);
      const resolvedPath = Bun.resolveSync(documentPath, cwd);
      const htmlPath = getHtmlPath({
        dest: options.dest,
        documentPath,
        routePathname,
      });

      result.push({
        path: documentPath,
        resolvedPath,
        route: routePathname,
        htmlPath,
      });
    } catch (error) {
      console.error(
        `[glazier] failed to resolve document path: ${documentPath}`,
        error,
      );
    }

    return result;
  }, []);
}

type GetHtmlPathParams = {
  dest: string;
  documentPath: DocumentPath;
  routePathname: RoutePathname;
};

/**
 * Generates the HTML path for the route document.
 *
 * @internal scope: package
 */
export function getHtmlPath(params: GetHtmlPathParams): DocumentHTMLPath {
  const { dest, documentPath, routePathname } = params;
  const parsedDocumentPath = path.parse(documentPath);
  const relativePath = routePathname.slice(1);
  const relativeFilePath =
    parsedDocumentPath.name === "index"
      ? path.join(relativePath, "index.html")
      : `${relativePath}.html`;
  const htmlPath = path.resolve(dest, relativeFilePath) as DocumentHTMLPath;

  return htmlPath;
}

async function cleanDestDir(dest: string): Promise<void> {
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
}

/**
 * Finds the root path of the documents by comparing the
 * longest path to the shortest path.
 *
 * @internal scope: package
 */
export function findRootPath(documentPaths: DocumentPath[]): DocumentRootPath {
  let longestPath: string | undefined;
  let shortestPath: string | undefined;

  for (const documentPath of documentPaths) {
    if (!longestPath || documentPath.length > longestPath.length) {
      longestPath = documentPath;
    }
    if (!shortestPath || documentPath.length < shortestPath.length) {
      shortestPath = documentPath;
    }
  }
  if (!longestPath || !shortestPath) {
    return "";
  }
  if (longestPath === shortestPath) {
    return longestPath;
  }

  // We can't use `path.sep` here, because the paths may be
  // absolute paths or module paths, so we need to detect the separator.
  const separator = longestPath.includes("\\") ? "\\" : "/";
  const longestPathParts = longestPath.split(separator);
  const shortestPathParts = shortestPath.split(separator);
  const commonParts = longestPathParts.filter((part, index) => {
    return part === shortestPathParts[index];
  });

  return commonParts.join(separator);
}

type GenerateRoutesResult = {
  routes: Routes;
};

async function generateRoutes(
  options: Omit<DocumentRouteBuilder.Options.Resolved, "documents"> & {
    /**
     * An array of route document paths to generate routes for.
     */
    routeDocuments: readonly RouteDocument[];
    /**
     * Whether to force regeneration of all routes, even if the HTML file already exists.
     */
    force?: boolean;
  },
): Promise<GenerateRoutesResult> {
  const { dest, routeDocuments, pageTemplate, force } = options;
  const startTime = performance.now();
  // NOTE: While `Routes` don't _need_ to be created in this function,
  // they must not be created before the HTML files are generated,
  // because the HTML files are imported as HTML bundles.
  // As such, we create the `Routes` while generating the HTML files,
  // to ensure the files are generated first.
  const routes: Routes = {};
  const htmlGenerator = new RouteHtmlGenerator(dest, pageTemplate);
  const documentPathToRoutePathname = options.documentPathToRoutePathname;

  let numFileWritten = 0;

  await Promise.all(
    routeDocuments.map(async (routeDocument) => {
      const htmlPath = routeDocument.htmlPath;
      const routePathname = routeDocument.route;
      const htmlFile = Bun.file(htmlPath);
      const htmlFileExists = await htmlFile.exists();

      if (force || !htmlFileExists) {
        // console.debug(`[glazier] writing:`, {
        //   documentPath: routeDocument.path,
        //   routePathname,
        //   htmlPath,
        // });

        await Bun.write(htmlFile, await htmlGenerator.generate(routeDocument));

        numFileWritten++;
      }

      // Then immediately import the generated HTML file
      // as a HTMLBundle
      routes[routePathname] = (
        (await import(htmlPath)) as BunHTMLBundleModule
      ).default;
    }),
  );

  const duration = performance.now() - startTime;

  console.info(
    `[glazier] ${routeDocuments.length} routes, ${numFileWritten} files written. (${duration.toFixed(2)}ms)`,
  );

  return {
    routes,
  };
}

// TODO: Remove this function if not needed.
// I really don't want to spend any time supporting native Windows.
// Just use WSL if you need/like to work on Windows (like I do 😉).
function winToPosixPath(value: string): string {
  if (!value.includes("\\")) {
    return value;
  }

  return value.replace(/^[a-zA-Z]:\\/, "/").replace(/\\/g, "/");
}

/**
 * Generates a route slug from the document path.
 *
 * @internal scope: package
 */
export function generateRoutePathname(
  root: string,
  documentPath: DocumentPath,
): RoutePathname {
  const ext = path.extname(documentPath);

  let result = documentPath.slice(
    0,
    ext.length === 0 ? undefined : -ext.length,
  );

  if (!result.startsWith(root)) {
    return winToPosixPath(result) as RoutePathname;
  }

  result = result.slice(root.length ? root.length + 1 : 0);
  result = result.charAt(0) === "/" ? (result as RoutePathname) : `/${result}`;

  if (result.endsWith("/index")) {
    result = result.slice(0, -5);
  }

  return winToPosixPath(result) as RoutePathname;
}

class RouteHtmlGenerator {
  #dest: string;
  #pageTemplate: PageTemplate;

  constructor(dest: string, pageTemplate: PageTemplate) {
    this.#dest = dest;
    this.#pageTemplate = pageTemplate;
  }

  #pageTemplateHtmlCache: Promise<string> | undefined;

  async #getPageTemplatePath(): Promise<string> {
    const htmlBundleModule = await this.#pageTemplate;

    assertBunHTMLBundleModule(htmlBundleModule);

    return htmlBundleModule.default.index;
  }

  async #getPageTemplateHtml(): Promise<string> {
    if (this.#pageTemplateHtmlCache) {
      return this.#pageTemplateHtmlCache;
    }

    const pageTemplatePath = await this.#getPageTemplatePath();

    this.#pageTemplateHtmlCache = Bun.file(pageTemplatePath).text();

    return this.#pageTemplateHtmlCache;
  }

  #renderContentIncludeTag(contentIncludePath: string): string {
    return `<${KnytTagName.Include} src="${contentIncludePath}"></${KnytTagName.Include}>`;
  }

  async #generateFromHtmlBundle(doc: RouteDocument): Promise<string> {
    const contentIncludePath = doc.path;
    const pageTemplatePath = await this.#getPageTemplatePath();
    const templateHtml = await this.#getPageTemplateHtml();
    const contentIncludeTag = this.#renderContentIncludeTag(contentIncludePath);

    return prepareHtmlForTransformation({
      htmlText: templateHtml,
      includePath: pageTemplatePath,
      inputDir: path.dirname(doc.htmlPath),
      slotChildren: contentIncludeTag,
      frontmatterSrc: contentIncludePath,
    });
  }

  async generate(doc: RouteDocument): Promise<string> {
    const contentIncludePath = doc.path;

    if (typeof this.#pageTemplate === "function") {
      return this.#pageTemplate({
        includePath: contentIncludePath,
        includeTag: this.#renderContentIncludeTag(contentIncludePath),
      });
    }

    return this.#generateFromHtmlBundle(doc);
  }
}

class Deferred<T> {
  #isFulfilled = false;
  #deferred = Promise.withResolvers<T>();

  get isFulfilled(): boolean {
    return this.#isFulfilled;
  }

  get promise(): Promise<T> {
    return this.#deferred.promise;
  }

  resolve = (value: T | PromiseLike<T>) => {
    this.#isFulfilled = true;

    this.#deferred.resolve(value);
  };

  reject = (reason?: unknown) => {
    this.#isFulfilled = true;

    this.#deferred.reject(reason);
  };
}
