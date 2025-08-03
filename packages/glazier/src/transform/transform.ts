/// <reference types="bun-types" />

import path from "node:path";

import {
  Transformer,
  type TransformOptions,
  type TransformResult,
} from "./Transformer";

// Banned globals
declare const customElements: never;
declare const document: never;
declare const window: never;

/**
 * Creates a new HTML rewriter that can be used to transform HTML
 */
export async function transform(
  inputPath: string,
  inputHtml: string,
  options: TransformOptions,
): Promise<TransformResult> {
  const startTime = performance.now();

  const transformer = new Transformer(options);
  const outputHtml = await transformer.transform(inputPath, inputHtml);
  const { request, rendererModulePaths } = transformer;
  const duration = Math.round(performance.now() - startTime);

  console.info(
    `[glazier] transform ${path.relative(process.cwd(), inputPath)} (${duration}ms)`,
  );

  return {
    request,
    inputPath,
    html: outputHtml,
    rendererModulePaths,
  };
}
