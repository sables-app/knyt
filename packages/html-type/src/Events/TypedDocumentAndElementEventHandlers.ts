import { TypedClipboardEvent } from "./TypedEvents/TypedClipboardEvent.ts";

export interface TypedDocumentAndElementEventHandlers<T> {
  oncopy?(ev: TypedClipboardEvent<T>): unknown;
  oncut?(ev: TypedClipboardEvent<T>): unknown;
  onpaste?(ev: TypedClipboardEvent<T>): unknown;
}
