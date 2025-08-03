import mdx from "@mdx-js/esbuild";
import { plugin, type BunPlugin } from "bun";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

const mdxPlugin = mdx({
  // Set the JSX runtime to use Knyt.
  // This is required for the MDX plugin to work with the Knyt plugin.
  jsxImportSource: "knyt",
  // Added frontmatter support to the MDX plugin.
  // This is not required, but it is recommended.
  // Knyt has a built-in frontmatter support.
  remarkPlugins: [
    remarkFrontmatter,
    remarkMdxFrontmatter,
    // Add any other remark plugins here...
  ],
  // Type assertion is needed because Bun's plugin type
  // is not fully compatible with esbuild's plugin type.
}) as unknown as BunPlugin;

// This enables importing MDX for the Bun runtime.
// This is necessary for server-side rendering of MDX documents.
plugin(mdxPlugin);

// This enables importing MDX for Bun's static bundler.
// This is necessary for MDX to be bundled and served to the client.
export default mdxPlugin;
