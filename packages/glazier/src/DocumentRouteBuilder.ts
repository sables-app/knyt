import { mkdir, rm, watch } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { getTempDir } from "./getTempDir";
import type { GlazierPlugin } from "./GlazierPlugin";
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
 * The `HTMLBundle` type is the actual type that's returned by the
 * `generateRoutes` function. It's a record of route paths to `HTMLBundle`.
 */
type Routes = Record<string, Bun.HTMLBundle>;

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
 * @example "package-name/docs/getting-started.md"
 * @example "/absolute/path/to/docs/getting-started.md"
 * @example "C:\\absolute\\path\\to\\docs\\getting-started.md"
 */
type DocumentPath = string;

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
 * @example "C:\\absolute\\path\\to\\docs"
 */
type DocumentRootPath = string;

/**
 * An absolute path to the generated HTML file.
 */
type HTMLPath = `${string}.html`;

export type RouteDocument = {
  path: DocumentPath;
  route: RoutePathname;
  htmlPath: HTMLPath;
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

  if (!original.dest) {
    const cwd = process.cwd();
    const relativeDest = dest.startsWith(cwd) ? path.relative(cwd, dest) : dest;

    console.info(`[glazier] destination directory: ${relativeDest}`);
  }

  return {
    ...original,
    dest,
    documentRoot,
    fresh,
    documentPathToRoutePathname,
  };
}

export class DocumentRouteBuilder {
  #originalOptions: DocumentRouteBuilder.Options;
  #resolvedOptions: DocumentRouteBuilder.Options.Resolved | undefined;

  async #getResolvedOptions(): Promise<DocumentRouteBuilder.Options.Resolved> {
    if (!this.#resolvedOptions) {
      this.#resolvedOptions = await resolveOptions(this.#originalOptions);
    }

    return this.#resolvedOptions;
  }

  constructor(options: DocumentRouteBuilder.Options) {
    this.#originalOptions = options;

    // By default, listen to the default plugin
    this.listenTo(glazierPlugin);
  }

  #routes: Promise<Routes> | undefined;

  async getRoutes(): Promise<
    // This needs to use `any` because Bun uses a generic to infer route information
    // but generated routes are not typed.
    // TODO: Revisit this to see if we can avoid `any`.
    Record<string, any>
  > {
    if (!this.#routes) {
      const resolvedOptions = await this.#getResolvedOptions();

      this.#routes = cleanAndGenerateRoutes(resolvedOptions);

      // If we're in development mode, watch the documents
      // for changes and regenerate the routes.
      // TODO: Uncomment this once the API is made available.
      // if (resolvedOptions.development) {
      //   this.#watchDocuments();
      // }
    }

    return this.#routes;
  }

  // TODO: Finish implementing this method.
  async #watchDocuments(): Promise<void> {
    const { documents, ...otherOptions } = await this.#getResolvedOptions();
    const abortController = new AbortController();

    console.info("Watching documents for changes...");

    documents.forEach(async (documentPath) => {
      // The document path may be a module path or an absolute path.
      // We need to resolve it to an absolute path.
      // Relative paths aren't supported, but we can resolve
      // them to the current working directory for a sane default.
      const filePath = Bun.resolveSync(documentPath, process.cwd());

      if (!(await Bun.file(filePath).exists())) {
        console.warn(`Could not resolve document path: ${documentPath}.`);
        return;
      }

      const watcher = watch(filePath, { signal: abortController.signal });

      for await (const event of watcher) {
        console.info(`Detected ${event.eventType} in ${event.filename}`);

        // TODO: It isn't enough to regenerate the route document.
        // We need to clean the module cache for the document,
        // and reload the server routes.
        // TODO: Finish implementing this once the APIs are available.
        await regenerateRoute(documentPath, otherOptions);
      }
    });

    process.on("SIGINT", () => {
      console.info("Stopping watcher...");
      abortController.abort();
    });
  }

  #handleRequest: BunKnytConfig.OnRequest = async (request): Promise<void> => {
    const resolvedOptions = await this.#getResolvedOptions();
    const urlBase = Bun.pathToFileURL(resolvedOptions.dest).toString();
    const routePath = request.url
      .slice(urlBase.length)
      .replace(/(\/index)?\.html$/, "");
    const resolveRoutePath = routePath === "" ? "/" : routePath;

    routePathState.associate(request, resolveRoutePath);
  };

  listenTo(plugin: GlazierPlugin): void {
    plugin.onRequest(this.#handleRequest);
  }
}

export namespace DocumentRouteBuilder {
  export type Options = {
    /**
     * Whether to enable development mode.
     *
     * @remarks
     *
     * When enabled, the server will automatically regenerate the routes
     * when the documents change.
     * This is useful for development, but should be disabled in production.
     */
    // TODO: Implement this option
    // development?: boolean;
    /**
     * The destination path for the generated routes.
     * This is the path where the generated HTML files will be saved.
     * If not provided, a temporary directory will be used.
     */
    // TODO: Remove this option whenever HTML bundles can stored in memory as virtual modules.
    dest?: string;
    /**
     * An array of either module paths or absolute file paths to documents
     * to be converted into routes.
     *
     * @remarks
     *
     * These can be either complete module paths or absolute file paths.
     * Both are resolved and imported by Bun.
     *
     * @example "package-name/docs/getting-started.md"
     * @example "/absolute/path/to/docs/getting-started.md"
     */
    documents: DocumentPath[];
    /**
     * The page template to use for generating the routes.
     * This can be a function or a promise for an HTML import.
     */
    pageTemplate: PageTemplate;
    /**
     * The root path for the documents.
     *
     * @example "package-name/docs"
     * @example "/absolute/path/to/docs"
     * @example "C:\\absolute\\path\\to\\docs"
     */
    documentRoot?: DocumentRootPath;
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
    export type Resolved = Required<Options>;
  }
}

type RouteDocumentParams = {
  dest: string;
  documentPath: DocumentPath;
  routePathname: RoutePathname;
};

function createRouteDocument(params: RouteDocumentParams): RouteDocument {
  return {
    path: params.documentPath,
    route: params.routePathname,
    htmlPath: getHtmlPath(params),
  };
}

/**
 * Generates the HTML path for the route document.
 *
 * @internal scope: package
 */
export function getHtmlPath(params: RouteDocumentParams): HTMLPath {
  const { dest, documentPath, routePathname } = params;
  const parsedDocumentPath = path.parse(documentPath);
  const relativePath = routePathname.slice(1);
  const relativeFilePath =
    parsedDocumentPath.name === "index"
      ? path.join(relativePath, "index.html")
      : `${relativePath}.html`;
  const htmlPath = path.resolve(dest, relativeFilePath) as HTMLPath;

  return htmlPath;
}

async function cleanDestDir(dest: string): Promise<void> {
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
}

async function cleanAndGenerateRoutes(
  options: DocumentRouteBuilder.Options.Resolved,
): Promise<Routes> {
  if (options.fresh) {
    await cleanDestDir(options.dest);
  }

  return generateRoutes(options);
}

async function regenerateRoute(
  documentPath: string,
  options: Omit<DocumentRouteBuilder.Options.Resolved, "documents">,
): Promise<void> {
  await generateRoutes({
    ...options,
    documents: [documentPath],
  });
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

async function generateRoutes(
  options: DocumentRouteBuilder.Options.Resolved,
): Promise<Routes> {
  const { dest, documents, pageTemplate } = options;
  const startTime = performance.now();
  const output: Routes = {};
  const htmlGenerator = new RouteHtmlGenerator(dest, pageTemplate);
  const documentPathToRoutePathname = options.documentPathToRoutePathname;

  let numFileWritten = 0;

  await Promise.all(
    documents.map(async (documentPath) => {
      const routePathname = documentPathToRoutePathname(documentPath);
      const routeDocument = await createRouteDocument({
        dest,
        documentPath,
        routePathname,
      });
      const htmlPath = routeDocument.htmlPath;
      const htmlFile = Bun.file(htmlPath);

      if ((await htmlFile.exists()) === false) {
        await Bun.write(htmlFile, await htmlGenerator.generate(routeDocument));
        numFileWritten++;
      }

      // Then immediately import the generated HTML file
      // as a HTMLBundle
      output[routePathname] = (
        (await import(htmlPath)) as BunHTMLBundleModule
      ).default;
    }),
  );

  const duration = performance.now() - startTime;

  console.info(
    `[glazier] ${documents.length} routes, ${numFileWritten} files written. (${duration.toFixed(2)}ms)`,
  );

  return output;
}

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
