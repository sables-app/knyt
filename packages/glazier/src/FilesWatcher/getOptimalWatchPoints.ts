/** @internal scope: package */
export type OptimalPoint = OptimalPoint.Directory | OptimalPoint.File;

/** @internal scope: package */
export enum OptimalPointType {
  Directory = "directory",
  File = "file",
}

/** @internal scope: package */
export namespace OptimalPoint {
  export type Directory = {
    type: `${OptimalPointType.Directory}`;
    /**
     * Absolute path to the directory to be watched.
     *
     * @remarks
     *
     * Leading slash is omitted even for root directories.
     *
     * @example "src/components"
     */
    path: string;
    depth: number;
    /**
     * List of file paths covered by this watch point.
     *
     * @remarks
     *
     * Leading slash is omitted even for root directories.
     *
     * @example
     * ```ts
     * ["src/components/Button.tsx"]
     * ``
     */
    filePaths: readonly string[];
  };

  export type File = {
    type: `${OptimalPointType.File}`;
    /**
     * Absolute path to the file to be watched.
     *
     * @remarks
     *
     * Leading slash is omitted even for root directories.
     *
     * @example "src/components/Button.tsx"
     */
    path: string;
    depth: number;
    /**
     * List of file paths covered by this watch point.
     *
     * @remarks
     *
     * Leading slash is omitted even for root directories.
     *
     * @example
     * ```ts
     * ["src/components/Button.tsx"]
     * ``
     */
    filePaths: readonly string[];
  };
}

/** @internal scope: package */
export type PathTree = {
  [key: string]: PathTree.Node;
};

/** @internal scope: package */
export namespace PathTree {
  export type Node = {
    // filesCovered: number;
    children: PathTree;
    baseNames: string[];
  };
}

function buildDirectoryTree(_files: Iterable<string>): PathTree {
  const files = new Set(_files);
  const tree: PathTree = {};

  for (const file of files) {
    // This will remove leading/trailing slashes and split the path
    const segments = file.split("/").filter(Boolean);
    const baseName = segments[segments.length - 1];

    let current = tree;

    for (let i = 0; i < segments.length - 1; i++) {
      const isLastDir = i === segments.length - 2;
      const part = segments[i];

      if (!current[part]) {
        current[part] = {
          children: {},
          baseNames: [],
        };
      }

      if (isLastDir) {
        current[part].baseNames.push(baseName);
      }

      current = current[part].children;
    }
  }

  return tree;
}

/**
 * Get optimal watch points (files or directories) for a list of file paths.
 *
 * @remarks
 *
 * This function analyzes the directory structure of the provided file paths
 * and determines the most efficient points to watch for changes. It aims to
 * minimize the number of watch points by selecting directories when multiple
 * files are present, while still allowing for individual file watches when
 * necessary.
 *
 * @param files - An iterable of file paths to analyze.
 * @returns An array of optimal watch points, each being either a file or a directory.
 */
export function getOptimalWatchPoints(
  files: Iterable<string>,
): readonly OptimalPoint[] {
  const analysis = analyzeDirectoryTree({
    tree: buildDirectoryTree(files),
    currentPath: "",
    currentDepth: 0,
  });

  return analysis.optimalPoints;
}

type Analysis = {
  optimalPoints: readonly OptimalPoint[];
};

function analyzeDirectoryTree({
  tree,
  currentPath,
  analysis: prevAnalysis,
  currentDepth,
}: {
  tree: PathTree;
  currentPath: string;
  analysis?: Analysis;
  currentDepth: number;
}): Analysis {
  const workingAnalysis = {
    optimalPoints: [...(prevAnalysis?.optimalPoints ?? [])],
  };

  for (const entry of Object.entries(tree)) {
    const [dir, info] = entry as [string, PathTree.Node];
    const fullDirPath = currentPath ? `${currentPath}/${dir}` : dir;
    const filePaths = info.baseNames.map(
      (baseName) => `${fullDirPath}/${baseName}`,
    );

    // Decision heuristic: watch directory if it contains multiple files
    // and we're not too deep in the tree
    if (info.baseNames.length > 1) {
      workingAnalysis.optimalPoints.push({
        type: OptimalPointType.Directory,
        path: fullDirPath,
        depth: currentDepth,
        filePaths,
      });
    } else if (filePaths[0]) {
      // Watch individual files in this directory
      // (In practice, you'd track which specific files are here)
      workingAnalysis.optimalPoints.push({
        type: OptimalPointType.File,
        path: filePaths[0],
        depth: currentDepth,
        filePaths,
      });
    }

    // Recurse into subdirectories
    if (Object.keys(info.children).length > 0) {
      const nextAnalysis = analyzeDirectoryTree({
        tree: info.children,
        currentPath: fullDirPath,
        analysis: workingAnalysis,
        currentDepth: currentDepth + 1,
      });

      workingAnalysis.optimalPoints = [...nextAnalysis.optimalPoints];
    }
  }

  return workingAnalysis;
}
