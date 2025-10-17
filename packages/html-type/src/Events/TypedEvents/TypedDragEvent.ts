import { TypedMouseEvent } from "./TypedMouseEvent.ts";

export interface TypedDragEvent<T> extends TypedMouseEvent<T> {
  /**
   * Returns the DataTransfer object for the event.
   */
  readonly dataTransfer: DataTransfer | null;
}
