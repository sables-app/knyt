import { GlobalEvents } from ".";
import { TypedDocumentAndElementEventHandlers } from "./TypedDocumentAndElementEventHandlers.ts";
import { TypedElementEvent } from "./TypedElementEvent.ts";

// Based on SVGElementEventMap
export interface SVGEvents<T extends EventTarget>
  extends GlobalEvents<T>,
    TypedElementEvent<T>,
    TypedDocumentAndElementEventHandlers<T> {}
