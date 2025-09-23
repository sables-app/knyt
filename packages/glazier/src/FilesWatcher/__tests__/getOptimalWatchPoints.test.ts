/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { getOptimalWatchPoints } from "../getOptimalWatchPoints";

describe("getOptimalWatchPoints", () => {
  it("identifies optimal watch points in a complex directory structure", () => {
    const files = [
      "src/components/Button.tsx",
      "src/components/Input.tsx",
      "src/utils/helpers.ts",
      "src/utils/formatters.ts",
      "src/index.ts",
      "tests/Button.test.tsx",
      "tests/Input.test.tsx",
      "README.md",
    ];

    const watchPoints = getOptimalWatchPoints(files);

    expect(watchPoints).toEqual([
      {
        type: "file",
        path: "src/index.ts",
        depth: 0,
        filePaths: ["src/index.ts"],
      },
      {
        type: "directory",
        path: "src/components",
        depth: 1,
        filePaths: ["src/components/Button.tsx", "src/components/Input.tsx"],
      },
      {
        type: "directory",
        path: "src/utils",
        depth: 1,
        filePaths: ["src/utils/helpers.ts", "src/utils/formatters.ts"],
      },
      {
        type: "directory",
        path: "tests",
        depth: 0,
        filePaths: ["tests/Button.test.tsx", "tests/Input.test.tsx"],
      },
    ]);
  });

  it("handles deeply nested files and selects optimal directories", () => {
    const files = new Set([
      "/project/content/pub/example/code-block.mdx",
      "/project/content/pub/example/index.mdx",
      "/project/content/pub/example/kitchen-sink.mdx",
      "/project/content/pub/example/guide/integrations.mdx",
      "/project/content/pub/example/guide/concurrent-rendering.mdx",
      "/project/content/pub/example/guide/introduction.mdx",
      "/project/content/pub/example/guide/server-side-rendering.mdx",
      "/project/content/pub/example/guide/server-side-includes.mdx",
      "/project/content/pub/example/guide/declarative-rendering.mdx",
      "/project/content/pub/example/guide/static-site-generation.mdx",
      "/project/content/pub/example/guide/quick-start.mdx",
      "/project/content/pub/example/guide/views.mdx",
      "/project/content/pub/example/guide/observables.mdx",
      "/project/content/pub/example/guide/web-components.mdx",
      "/project/content/pub/example/guide/automatic-dependency-management.mdx",
      "/project/content/pub/example/guide/state-management.mdx",
      "/project/content/pub/example/guide/web-components/introduction.mdx",
      "/project/content/pub/example/guide/web-components/reactive-properties.mdx",
      "/project/content/pub/example/guide/web-components/hydration.mdx",
      "/project/content/pub/example/guide/web-components/controllers.mdx",
      "/project/content/pub/example/guide/web-components/lifecycle.mdx",
      "/project/content/pub/example/guide/web-components/reactivity.mdx",
      "/project/content/pub/example/guide/web-components/options.mdx",
      "/project/content/pub/example/guide/web-components/containers.mdx",
      "/project/content/pub/example/guide/web-components/styling.mdx",
      "/project/content/pub/example/guide/integrations/mdx.mdx",
      "/project/content/pub/example/guide/integrations/htmx.mdx",
      "/project/content/pub/example/guide/integrations/rxjs.mdx",
      "/project/content/pub/example/guide/integrations/lit.mdx",
      "/project/content/pub/example/guide/integrations/bun.mdx",
      "/project/content/pub/example/guide/integrations/web-components.mdx",
    ]);

    const watchPoints = getOptimalWatchPoints(files);

    expect(watchPoints).toEqual([
      {
        depth: 3,
        filePaths: [
          "project/content/pub/example/code-block.mdx",
          "project/content/pub/example/index.mdx",
          "project/content/pub/example/kitchen-sink.mdx",
        ],
        path: "project/content/pub/example",
        type: "directory",
      },
      {
        depth: 4,
        filePaths: [
          "project/content/pub/example/guide/integrations.mdx",
          "project/content/pub/example/guide/concurrent-rendering.mdx",
          "project/content/pub/example/guide/introduction.mdx",
          "project/content/pub/example/guide/server-side-rendering.mdx",
          "project/content/pub/example/guide/server-side-includes.mdx",
          "project/content/pub/example/guide/declarative-rendering.mdx",
          "project/content/pub/example/guide/static-site-generation.mdx",
          "project/content/pub/example/guide/quick-start.mdx",
          "project/content/pub/example/guide/views.mdx",
          "project/content/pub/example/guide/observables.mdx",
          "project/content/pub/example/guide/web-components.mdx",
          "project/content/pub/example/guide/automatic-dependency-management.mdx",
          "project/content/pub/example/guide/state-management.mdx",
        ],
        path: "project/content/pub/example/guide",
        type: "directory",
      },
      {
        depth: 5,
        filePaths: [
          "project/content/pub/example/guide/web-components/introduction.mdx",
          "project/content/pub/example/guide/web-components/reactive-properties.mdx",
          "project/content/pub/example/guide/web-components/hydration.mdx",
          "project/content/pub/example/guide/web-components/controllers.mdx",
          "project/content/pub/example/guide/web-components/lifecycle.mdx",
          "project/content/pub/example/guide/web-components/reactivity.mdx",
          "project/content/pub/example/guide/web-components/options.mdx",
          "project/content/pub/example/guide/web-components/containers.mdx",
          "project/content/pub/example/guide/web-components/styling.mdx",
        ],
        path: "project/content/pub/example/guide/web-components",
        type: "directory",
      },
      {
        depth: 5,
        filePaths: [
          "project/content/pub/example/guide/integrations/mdx.mdx",
          "project/content/pub/example/guide/integrations/htmx.mdx",
          "project/content/pub/example/guide/integrations/rxjs.mdx",
          "project/content/pub/example/guide/integrations/lit.mdx",
          "project/content/pub/example/guide/integrations/bun.mdx",
          "project/content/pub/example/guide/integrations/web-components.mdx",
        ],
        path: "project/content/pub/example/guide/integrations",
        type: "directory",
      },
    ]);
  });
});
