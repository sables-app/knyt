import type { AttributeValue } from "./types/mod.ts";

namespace Parameters {
  export type Default =
    | [value: string | boolean | undefined]
    | [suffix: string, value: string | boolean | undefined];

  /**
   * When `true` the attribute is rendered on the element
   * When `false` or `undefined` the attribute is not rendered.
   */
  export type Boolean = [value: boolean | undefined];

  export type JsonObject = [jsonObject: Record<string, any> | undefined];

  export type OnAttribute =
    | [eventName: keyof GlobalEventHandlersEventMap, value: string | undefined]
    | [htmxEventName: `:${Lowercase<EventName>}`, value: string | undefined]
    | [htmxEventName: `:${EventName.KebabCase}`, value: string | undefined];

  export type SwapAttribute = [value: `${SwapValue}` | undefined];

  export type RequestAttribute = [value: RequestConfig | undefined];

  /**
   * NOTE: The value is not a `boolean`; i.e. only `false` is allowed.
   * `false` will be rendered as `hx-history="false"`.
   */
  export type HistoryAttribute = [value: false | undefined];
}

/**
 * Parameters for attributes by name
 */
type AttributeParameters = {
  // Core Attributes
  [AttributeName.Get]: Parameters.Default;
  [AttributeName.Post]: Parameters.Default;
  [AttributeName.On]: Parameters.OnAttribute;
  [AttributeName.PushUrl]: Parameters.Default;
  [AttributeName.Select]: Parameters.Default;
  [AttributeName.SelectOob]: Parameters.Default;
  [AttributeName.Swap]: Parameters.SwapAttribute;
  [AttributeName.SwapOob]: Parameters.Default;
  [AttributeName.Target]: Parameters.Default;
  [AttributeName.Trigger]: Parameters.Default;
  [AttributeName.Vals]: Parameters.JsonObject;

  // Additional Attributes
  [AttributeName.Boost]: Parameters.Default;
  [AttributeName.Confirm]: Parameters.Default;
  [AttributeName.Delete]: Parameters.Default;
  [AttributeName.Disable]: Parameters.Default;
  [AttributeName.DisabledElt]: Parameters.Default;
  [AttributeName.Disinherit]: Parameters.Default;
  [AttributeName.Encoding]: Parameters.Default;
  [AttributeName.Ext]: Parameters.Default;
  [AttributeName.Headers]: Parameters.Default;
  [AttributeName.History]: Parameters.HistoryAttribute;
  [AttributeName.HistoryElt]: Parameters.Boolean;
  [AttributeName.Include]: Parameters.Default;
  [AttributeName.Indicator]: Parameters.Default;
  [AttributeName.Inherit]: Parameters.Default;
  [AttributeName.Params]: Parameters.Default;
  [AttributeName.Patch]: Parameters.Default;
  [AttributeName.Preserve]: Parameters.Default;
  [AttributeName.Prompt]: Parameters.Default;
  [AttributeName.Put]: Parameters.Default;
  [AttributeName.ReplaceUrl]: Parameters.Default;
  [AttributeName.Request]: Parameters.RequestAttribute;
  [AttributeName.Sync]: Parameters.Default;
  [AttributeName.Validate]: Parameters.Default;
  [AttributeName.Vars]: Parameters.Default;
};

type AttributeDeclaration = {
  name: `hx-${string}`;
  value: AttributeValue;
};

export type HxFn<T> = {
  /**
   * Add an arbitrary htmx attribute to the element
   */
  /*
   * ### Private Remarks
   *
   * NOTE:
   *
   * tldr; The first union type must be a tuple with a single element.
   *
   * One of the union types for the parameter list MUST be a tuple
   * with a single element. This is because the fallback type for
   * unknown props/attributes resolves to `[any]` and TypeScript
   * will not allow a union that doesn't have at least one tuple
   * with a single element.
   *
   * Here we are satisfying that requirement by having accepting
   * an `AttributeDeclaration` as a single parameter.
   */
  (attributeDeclaration: AttributeDeclaration): T;

  /**
   * Add a htmx attribute to the element
   */
  <A extends AttributeName>(name: `${A}`, ...params: AttributeParameters[A]): T;
};

/**
 * The possible values for the `hx-swap` attribute
 */
enum SwapValue {
  /**
   * Replace the inner html of the target element
   */
  InnerHTML = "innerHTML",
  /**
   * Replace the entire target element with the response
   */
  OuterHTML = "outerHTML",
  /**
   * Replace the text content of the target element, without parsing the response as HTML
   */
  TextContent = "textContent",
  /**
   * Insert the response before the target element
   */
  Beforebegin = "beforebegin",
  /**
   * Insert the response before the first child of the target element
   */
  Afterbegin = "afterbegin",
  /**
   * Insert the response after the last child of the target element
   */
  Beforeend = "beforeend",
  /**
   * Insert the response after the target element
   */
  Afterend = "afterend",
  /**
   * Deletes the target element regardless of the response
   */
  Delete = "delete",
  /**
   * Does not append content from response (out of band items will still be processed).
   */
  None = "none",
}

/**
 * The configuration for the request
 *
 * @see {@link https://htmx.org/attributes/hx-request/}
 */
type RequestConfig = {
  /**
   * the timeout for the request, in milliseconds
   */
  timeout?: number;
  /**
   * if the request will send credentials
   */
  credentials?: boolean;
  /**
   * strips all headers from the request
   */
  noHeaders?: boolean;
};

/**
 * Event names without the `htmx:` prefix
 */
enum EventName {
  /**
   * send this event to an element to abort a request
   */
  Abort = "abort",
  /**
   * triggered after an AJAX request has completed processing a successful response
   */
  AfterOnLoad = "afterOnLoad",
  /**
   * triggered after htmx has initialized a node
   */
  AfterProcessNode = "afterProcessNode",
  /**
   * triggered after an AJAX request has completed
   */
  AfterRequest = "afterRequest",
  /**
   * triggered after the DOM has settled
   */
  AfterSettle = "afterSettle",
  /**
   * triggered after new content has been swapped in
   */
  AfterSwap = "afterSwap",
  /**
   * triggered before htmx disables an element or removes it from the DOM
   */
  BeforeCleanupElement = "beforeCleanupElement",
  /**
   * triggered before any response processing occurs
   */
  BeforeOnLoad = "beforeOnLoad",
  /**
   * triggered before htmx initializes a node
   */
  BeforeProcessNode = "beforeProcessNode",
  /**
   * triggered before an AJAX request is made
   */
  BeforeRequest = "beforeRequest",
  /**
   * triggered before a swap is done, allows you to configure the swap
   */
  BeforeSwap = "beforeSwap",
  /**
   * triggered just before an ajax request is sent
   */
  BeforeSend = "beforeSend",
  /**
   * triggered before the View Transition wrapped swap occurs
   */
  BeforeTransition = "beforeTransition",
  /**
   * triggered before the request, allows you to customize parameters, headers
   */
  ConfigRequest = "configRequest",
  /**
   * triggered after a trigger occurs on an element, allows you to cancel (or delay) issuing the AJAX request
   */
  Confirm = "confirm",
  /**
   * triggered on an error during cache writing
   */
  HistoryCacheError = "historyCacheError",
  /**
   * triggered on a cache miss in the history subsystem
   */
  HistoryCacheMiss = "historyCacheMiss",
  /**
   * triggered on a unsuccessful remote retrieval
   */
  HistoryCacheMissError = "historyCacheMissError",
  /**
   * triggered on a successful remote retrieval
   */
  HistoryCacheMissLoad = "historyCacheMissLoad",
  /**
   * triggered when htmx handles a history restoration action
   */
  HistoryRestore = "historyRestore",
  /**
   * triggered before content is saved to the history cache
   */
  BeforeHistorySave = "beforeHistorySave",
  /**
   * triggered when new content is added to the DOM
   */
  Load = "load",
  /**
   * triggered when an element refers to a SSE event in its trigger, but no parent SSE source has been defined
   */
  NoSSESourceError = "noSSESourceError",
  /**
   * triggered when an exception occurs during the onLoad handling in htmx
   */
  OnLoadError = "onLoadError",
  /**
   * triggered after an out of band element as been swapped in
   */
  OOBAfterSwap = "oobAfterSwap",
  /**
   * triggered before an out of band element swap is done, allows you to configure the swap
   */
  OOBBeforeSwap = "oobBeforeSwap",
  /**
   * triggered when an out of band element does not have a matching ID in the current DOM
   */
  OOBErrorNoTarget = "oobErrorNoTarget",
  /**
   * triggered after a prompt is shown
   */
  Prompt = "prompt",
  /**
   * triggered after a url is pushed into history
   */
  PushedIntoHistory = "pushedIntoHistory",
  /**
   * triggered after a url is replaced in history
   */
  ReplacedInHistory = "replacedInHistory",
  /**
   * triggered when an HTTP response error (non-200 or 300 response code) occurs
   */
  ResponseError = "responseError",
  /**
   * triggered when a request is aborted
   */
  SendAbort = "sendAbort",
  /**
   * triggered when a network error prevents an HTTP request from happening
   */
  SendError = "sendError",
  /**
   * triggered when an error occurs with a SSE source
   */
  SseError = "sseError",
  /**
   * triggered when a SSE source is opened
   */
  SSEOpen = "sseOpen",
  /**
   * triggered when an error occurs during the swap phase
   */
  SwapError = "swapError",
  /**
   * triggered when an invalid target is specified
   */
  TargetError = "targetError",
  /**
   * triggered when a request timeout occurs
   */
  Timeout = "timeout",
  /**
   * triggered before an element is validated
   */
  ValidationValidate = "validation:validate",
  /**
   * triggered when an element fails validation
   */
  ValidationFailed = "validation:failed",
  /**
   * triggered when a request is halted due to validation errors
   */
  ValidationHalted = "validation:halted",
  /**
   * triggered when an ajax request aborts
   */
  XhrAbort = "xhr:abort",
  /**
   * triggered when an ajax request ends
   */
  XhrLoadend = "xhr:loadend",
  /**
   * triggered when an ajax request starts
   */
  XhrLoadstart = "xhr:loadstart",
  /**
   * triggered periodically during an ajax request that supports progress events
   */
  XhrProgress = "xhr:progress",
}

namespace EventName {
  /**
   * Attribute suffixes in kebab case without the `htmx:` prefix
   */
  export enum KebabCase {
    /**
     * send this event to an element to abort a request
     */
    Abort = "abort",
    /**
     * triggered after an AJAX request has completed processing a successful response
     */
    AfterOnLoad = "after-on-load",
    /**
     * triggered after htmx has initialized a node
     */
    AfterProcessNode = "after-process-node",
    /**
     * triggered after an AJAX request has completed
     */
    AfterRequest = "after-request",
    /**
     * triggered after the DOM has settled
     */
    AfterSettle = "after-settle",
    /**
     * triggered after new content has been swapped in
     */
    AfterSwap = "after-swap",
    /**
     * triggered before htmx disables an element or removes it from the DOM
     */
    BeforeCleanupElement = "before-cleanup-element",
    /**
     * triggered before any response processing occurs
     */
    BeforeOnLoad = "before-on-load",
    /**
     * triggered before htmx initializes a node
     */
    BeforeProcessNode = "before-process-node",
    /**
     * triggered before an AJAX request is made
     */
    BeforeRequest = "before-request",
    /**
     * triggered before a swap is done, allows you to configure the swap
     */
    BeforeSwap = "before-swap",
    /**
     * triggered just before an ajax request is sent
     */
    BeforeSend = "before-send",
    /**
     * triggered before the View Transition wrapped swap occurs
     */
    BeforeTransition = "before-transition",
    /**
     * triggered before the request, allows you to customize parameters, headers
     */
    ConfigRequest = "config-request",
    /**
     * triggered after a trigger occurs on an element, allows you to cancel (or delay) issuing the AJAX request
     */
    Confirm = "confirm",
    /**
     * triggered on an error during cache writing
     */
    HistoryCacheError = "history-cache-error",
    /**
     * triggered on a cache miss in the history subsystem
     */
    HistoryCacheMiss = "history-cache-miss",
    /**
     * triggered on a unsuccessful remote retrieval
     */
    HistoryCacheMissError = "history-cache-miss-error",
    /**
     * triggered on a successful remote retrieval
     */
    HistoryCacheMissLoad = "history-cache-miss-load",
    /**
     * triggered when htmx handles a history restoration action
     */
    HistoryRestore = "history-restore",
    /**
     * triggered before content is saved to the history cache
     */
    BeforeHistorySave = "before-history-save",
    /**
     * triggered when new content is added to the DOM
     */
    Load = "load",
    /**
     * triggered when an element refers to a SSE event in its trigger, but no parent SSE source has been defined
     */
    NoSSESourceError = "no-sse-source-error",
    /**
     * triggered when an exception occurs during the onLoad handling in htmx
     */
    OnLoadError = "on-load-error",
    /**
     * triggered after an out of band element as been swapped in
     */
    OOBAfterSwap = "oob-after-swap",
    /**
     * triggered before an out of band element swap is done, allows you to configure the swap
     */
    OOBBeforeSwap = "oob-before-swap",
    /**
     * triggered when an out of band element does not have a matching ID in the current DOM
     */
    OOBErrorNoTarget = "oob-error-no-target",
    /**
     * triggered after a prompt is shown
     */
    Prompt = "prompt",
    /**
     * triggered after a url is pushed into history
     */
    PushedIntoHistory = "pushed-into-history",
    /**
     * triggered after a url is replaced in history
     */
    ReplacedInHistory = "replaced-in-history",
    /**
     * triggered when an HTTP response error (non-200 or 300 response code) occurs
     */
    ResponseError = "response-error",
    /**
     * triggered when a request is aborted
     */
    SendAbort = "send-abort",
    /**
     * triggered when a network error prevents an HTTP request from happening
     */
    SendError = "send-error",
    /**
     * triggered when an error occurs with a SSE source
     */
    SseError = "sse-error",
    /**
     * triggered when a SSE source is opened
     */
    SSEOpen = "sse-open",
    /**
     * triggered when an error occurs during the swap phase
     */
    SwapError = "swap-error",
    /**
     * triggered when an invalid target is specified
     */
    TargetError = "target-error",
    /**
     * triggered when a request timeout occurs
     */
    Timeout = "timeout",
    /**
     * triggered before an element is validated
     */
    ValidationValidate = "validation:validate",
    /**
     * triggered when an element fails validation
     */
    ValidationFailed = "validation:failed",
    /**
     * triggered when a request is halted due to validation errors
     */
    ValidationHalted = "validation:halted",
    /**
     * triggered when an ajax request aborts
     */
    XhrAbort = "xhr:abort",
    /**
     * triggered when an ajax request ends
     */
    XhrLoadend = "xhr:loadend",
    /**
     * triggered when an ajax request starts
     */
    XhrLoadstart = "xhr:loadstart",
    /**
     * triggered periodically during an ajax request that supports progress events
     */
    XhrProgress = "xhr:progress",
  }
}

/**
 * Attribute names without the `hx-` prefix
 */
enum AttributeName {
  // Core Attributes

  /**
   * Issues a GET to the specified URL
   *
   * @see {@link https://htmx.org/attributes/hx-get/}
   */
  Get = "get",
  /**
   * Issues a POST to the specified URL
   *
   * @see {@link https://htmx.org/attributes/hx-post/}
   */
  Post = "post",
  /**
   * Handle events with inline scripts on elements
   *
   * @see {@link https://htmx.org/attributes/hx-on/}
   */
  On = "on",
  /**
   * Push a URL into the browser location bar to create history
   *
   * @see {@link https://htmx.org/attributes/hx-push-url/}
   */
  PushUrl = "push-url",
  /**
   * Select content to swap in from a response
   *
   * @see {@link https://htmx.org/attributes/hx-select/}
   */
  Select = "select",
  /**
   * Select content to swap in from a response, somewhere other than the target (out of band)
   *
   * @see {@link https://htmx.org/attributes/hx-select-oob/}
   */
  SelectOob = "select-oob",
  /**
   * Controls how content will swap in (outerHTML, beforeend, afterend, …)
   *
   * @see {@link https://htmx.org/attributes/hx-swap/}
   */
  Swap = "swap",
  /**
   * Mark element to swap in from a response (out of band)
   *
   * @see {@link https://htmx.org/attributes/hx-swap-oob/}
   */
  SwapOob = "swap-oob",
  /**
   * Specifies the target element to be swapped
   *
   * @see {@link https://htmx.org/attributes/hx-target/}
   */
  Target = "target",
  /**
   * Specifies the event that triggers the request
   *
   * @see {@link https://htmx.org/attributes/hx-trigger/}
   */
  Trigger = "trigger",
  /**
   * Add values to submit with the request (JSON format)
   *
   * @see {@link https://htmx.org/attributes/hx-vals/}
   */
  Vals = "vals",

  // Additional Attributes
  /**
   * Add progressive enhancement for links and forms
   *
   * @see {@link https://htmx.org/attributes/hx-boost/}
   */
  Boost = "boost",
  /**
   * Shows a confirm() dialog before issuing a request
   *
   * @see {@link https://htmx.org/attributes/hx-confirm/}
   */
  Confirm = "confirm",
  /**
   * Issues a DELETE to the specified URL
   *
   * @see {@link https://htmx.org/attributes/hx-delete/}
   */
  Delete = "delete",
  /**
   * Disables htmx processing for the given node and any children nodes
   *
   * @see {@link https://htmx.org/attributes/hx-disable/}
   */
  Disable = "disable",
  /**
   * Adds the disabled attribute to the specified elements while a request is in flight
   *
   * @see {@link https://htmx.org/attributes/hx-disabled-elt/}
   */
  DisabledElt = "disabled-elt",
  /**
   * Control and disable automatic attribute inheritance for child nodes
   *
   * @see {@link https://htmx.org/attributes/hx-disinherit/}
   */
  Disinherit = "disinherit",
  /**
   * Changes the request encoding type
   *
   * @see {@link https://htmx.org/attributes/hx-encoding/}
   */
  Encoding = "encoding",
  /**
   * Extensions to use for this element
   *
   * @see {@link https://htmx.org/attributes/hx-ext/}
   */
  Ext = "ext",
  /**
   * Adds to the headers that will be submitted with the request
   *
   * @see {@link https://htmx.org/attributes/hx-headers/}
   */
  Headers = "headers",
  /**
   * Prevent sensitive data being saved to the history cache
   *
   * @see {@link https://htmx.org/attributes/hx-history/}
   */
  History = "history",
  /**
   * The element to snapshot and restore during history navigation
   *
   * @see {@link https://htmx.org/attributes/hx-history-elt/}
   */
  HistoryElt = "history-elt",
  /**
   * Include additional data in requests
   *
   * @see {@link https://htmx.org/attributes/hx-include/}
   */
  Include = "include",
  /**
   * The element to put the htmx-request class on during the request
   *
   * @see {@link https://htmx.org/attributes/hx-indicator/}
   */
  Indicator = "indicator",
  /**
   * Control and enable automatic attribute inheritance for child nodes if it has been disabled by default
   *
   * @see {@link https://htmx.org/attributes/hx-inherit/}
   */
  Inherit = "inherit",
  /**
   * Filters the parameters that will be submitted with a request
   *
   * @see {@link https://htmx.org/attributes/hx-params/}
   */
  Params = "params",
  /**
   * Issues a PATCH to the specified URL
   *
   * @see {@link https://htmx.org/attributes/hx-patch/}
   */
  Patch = "patch",
  /**
   * Specifies elements to keep unchanged between requests
   *
   * @see {@link https://htmx.org/attributes/hx-preserve/}
   */
  Preserve = "preserve",
  /**
   * Shows a prompt() before submitting a request
   *
   * @see {@link https://htmx.org/attributes/hx-prompt/}
   */
  Prompt = "prompt",
  /**
   * Issues a PUT to the specified URL
   *
   * @see {@link https://htmx.org/attributes/hx-put/}
   */
  Put = "put",
  /**
   * Replace the URL in the browser location bar
   *
   * @see {@link https://htmx.org/attributes/hx-replace-url/}
   */
  ReplaceUrl = "replace-url",
  /**
   * Configures various aspects of the request
   *
   * @see {@link https://htmx.org/attributes/hx-request/}
   */
  Request = "request",
  /**
   * Control how requests made by different elements are synchronized
   *
   * @see {@link https://htmx.org/attributes/hx-sync/}
   */
  Sync = "sync",
  /**
   * Force elements to validate themselves before a request
   *
   * @see {@link https://htmx.org/attributes/hx-validate/}
   */
  Validate = "validate",
  /**
   * Adds values dynamically to the parameters to submit with the request (deprecated, please use hx-vals)
   *
   * @see {@link https://htmx.org/attributes/hx-vars/}
   */
  Vars = "vars",
}

const attributeNames = Object.values(AttributeName);

export function isHtmxAttributeName(value: unknown): value is AttributeName {
  return attributeNames.includes(value as AttributeName);
}

function createHistoryAttributeDeclaration([
  history,
]: Parameters.HistoryAttribute): AttributeDeclaration {
  return {
    name: `hx-${AttributeName.History}`,
    value: history === false ? "false" : null,
  };
}

function createJsonObjectAttributeDeclaration(
  name: string,
  [jsonObject]: Parameters.JsonObject,
): AttributeDeclaration {
  return {
    name: `hx-${name}`,
    value: jsonObject ?? null,
  };
}

function createDefaultAttributeDeclaration(
  name: string,
  params: Parameters.Default,
): AttributeDeclaration {
  let value: string | boolean | undefined;
  let suffix: string | undefined;

  if (params.length === 1) {
    value = params[0];
  } else {
    suffix = params[0];
    value = params[1];
  }

  return {
    name: suffix ? `hx-${name}:${suffix}` : `hx-${name}`,
    value,
  };
}

export function hx<A extends AttributeName>(
  name: `${A}`,
  ...params: AttributeParameters[A]
): AttributeDeclaration {
  switch (name) {
    case AttributeName.History: {
      return createHistoryAttributeDeclaration(
        params as Parameters.HistoryAttribute,
      );
    }
    case AttributeName.Request:
    case AttributeName.Vals: {
      return createJsonObjectAttributeDeclaration(
        name,
        params as Parameters.RequestAttribute | Parameters.JsonObject,
      );
    }
    case AttributeName.HistoryElt:
    case AttributeName.On:
    case AttributeName.Swap:
    default: {
      return createDefaultAttributeDeclaration(
        name,
        params as
          | Parameters.OnAttribute
          | Parameters.SwapAttribute
          | Parameters.Default,
      );
    }
  }
}
