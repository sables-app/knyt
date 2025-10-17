import { TypedEvent } from "./TypedEvent.ts";

export interface TypedSubmitEvent<T>
  extends TypedEvent<T>,
    Pick<SubmitEvent, "submitter"> {}
