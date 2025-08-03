function defaultGlobalUnknownErrorHandler(error: unknown) {
  console.error(error);
}

type UnknownGlobalErrorHandler = (error: unknown) => void;

let unknownGlobalErrorHandler: UnknownGlobalErrorHandler =
  defaultGlobalUnknownErrorHandler;

/**
 * Set the global error handler for unknown errors.
 *
 * @remarks
 *
 * This handler is used as a fallback to catch and log errors
 * that are not caught by other error handlers.
 *
 * This should only be used as top-level safety net for error reporting and logging.
 */
export function setGlobalUnknownErrorHandler(
  handler: UnknownGlobalErrorHandler,
) {
  unknownGlobalErrorHandler = handler;
}

/**
 * Handle an unknown error.
 *
 * @remarks
 *
 * This handler should be used as a fallback to catch and log errors
 * that are not caught by other error handlers.
 */
export function handleGlobalUnknownError(error: unknown) {
  unknownGlobalErrorHandler(error);
}
