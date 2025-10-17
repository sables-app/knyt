import { GlobalEvents } from ".";
import { TypedDocumentAndElementEventHandlers } from "./TypedDocumentAndElementEventHandlers.ts";
import { TypedElementEvent } from "./TypedElementEvent.ts";

// Based on MathMLElementEventMap
export interface MathMLEvents<T extends EventTarget = MathMLElement>
  extends GlobalEvents<T>,
    TypedElementEvent<T>,
    TypedDocumentAndElementEventHandlers<T> {}
