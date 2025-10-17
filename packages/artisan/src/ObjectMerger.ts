import {
  combineCallbacks,
  getLastDefinedProperty,
  mergeEntityCollections,
  shallowEqual,
} from "./utils/mod.ts";

/**
 * @alpha
 */
type MergerTools = {
  callback: typeof combineCallbacks;
  entityCollection: typeof mergeEntityCollections;
  property: typeof getLastDefinedProperty;
};

type ToolCall = {
  toolName: keyof MergerTools;
  args: any[];
  result: any;
};

type CallCount = number;
type ToolCalls = Map<CallCount, ToolCall>;
type MergerMemo = Map<keyof MergerTools, ToolCalls>;

/**
 * @alpha
 */
export class ObjectMerger<T extends Record<string | number, any>> {
  #memoCallCounter = 0;
  #memo: MergerMemo = new Map();

  #tools: MergerTools = {
    callback: this.#memoizeTool("callback", combineCallbacks),
    // prettier-ignore
    entityCollection: this.#memoizeTool("entityCollection", mergeEntityCollections),
    property: this.#memoizeTool("property", getLastDefinedProperty),
  };

  #getToolCalls(toolName: keyof MergerTools): ToolCalls {
    let toolCalls = this.#memo.get(toolName);

    if (!toolCalls) {
      toolCalls = new Map();

      this.#memo.set(toolName, toolCalls);
    }

    return toolCalls;
  }

  #memoizeTool<T extends (...args: any[]) => any>(
    toolName: keyof MergerTools,
    mergeTool: T,
  ): T {
    return ((...args: any[]) => {
      const callCounter = this.#memoCallCounter++;

      const toolCalls = this.#getToolCalls(toolName);
      const previousCall = toolCalls.get(callCounter);
      const shouldUsePreviousCall =
        previousCall && shallowEqual(previousCall.args, args);

      if (shouldUsePreviousCall) {
        return previousCall.result;
      }

      const result = mergeTool(...args);

      toolCalls.set(callCounter, { toolName, args, result });

      return result;
    }) as T;
  }

  #previousResult: T | undefined;

  merge(work: (tools: MergerTools) => T): T {
    this.#memoCallCounter = 0;

    const result = work(this.#tools);

    if (this.#previousResult && shallowEqual(this.#previousResult, result)) {
      return this.#previousResult;
    }

    this.#previousResult = result;

    return result;
  }
}
