import { isUnknownDictionary } from "@knyt/artisan";

export async function getDocumentFrontmatter(documentPath: string) {
  let documentFrontmatter: Record<string, unknown> | undefined;

  // TODO: Add support for .yaml, .json, and .toml files.
  // Currently, we only support modules that export
  // a `frontmatter` object.
  try {
    // We don't sniff the file type here; instead we assume
    // that the file can be imported as a module, and
    // that the module may have a `frontmatter` export.
    const { frontmatter } = (await import(documentPath)) as Record<
      string,
      unknown
    >;

    if (isUnknownDictionary(frontmatter)) {
      documentFrontmatter = frontmatter;
    } else if (frontmatter !== undefined) {
      console.warn(
        `Document at ${documentPath} does not have a valid frontmatter export.`,
      );
    }
  } catch (error) {
    // We're only interested in the frontmatter export
    // and not the module itself, so if the import fails,
    // we'll log the error and continue, because it's
    // not critical to the route generation.
    //
    // TODO: Consider adding an option to throw an error
    // if the import fails.
    console.error(`Failed to import document at ${documentPath}.`, error);
  }

  return documentFrontmatter;
}
