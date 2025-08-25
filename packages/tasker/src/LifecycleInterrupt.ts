const __isKnytLifecycleInterrupt = Symbol.for(
  "knyt.luthier.LifecycleInterrupt",
);

/**
 * Type guard to check if a value is a `LifecycleInterrupt`.
 */
export function isLifecycleInterrupt<TReason = any>(
  value: unknown,
): value is LifecycleInterrupt<TReason> {
  return (
    value instanceof DOMException &&
    __isKnytLifecycleInterrupt in value &&
    value[__isKnytLifecycleInterrupt] === true
  );
}

/**
 * An exception that indicates the interruption of a Knyt lifecycle.
 */
export class LifecycleInterrupt<TReason> extends DOMException {
  readonly reason: TReason;

  constructor(reason: TReason) {
    super(`Knyt lifecycle interrupted: ${reason}`, "LifecycleInterrupt");

    this.reason = reason;
  }

  get [__isKnytLifecycleInterrupt](): true {
    return true;
  }
}
