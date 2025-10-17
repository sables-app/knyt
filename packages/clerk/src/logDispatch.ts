import type { Action, AnyAction } from "./types.ts";

/**
 * A key used in action meta to designate an action type
 * to be logged instead of the action's type.
 */
const ACTION_META_LOG_TYPE = "@knyt/clerk#logType";

function getActionType(action: AnyAction): string {
  const actionType = String(action.type);

  if ("meta" in action) {
    const meta = action.meta as {
      [ACTION_META_LOG_TYPE]?: string;
    };

    return meta[ACTION_META_LOG_TYPE] ?? actionType;
  }

  return actionType;
}

/**
 * Add a log type to an action.
 *
 * @public
 */
export function addLogType<T extends Action<any>>(
  action: T,
  logType: string,
): T {
  return {
    ...action,
    meta: {
      ...action.meta,
      [ACTION_META_LOG_TYPE]: logType,
    },
  };
}

/**
 * @public
 */
export function logDispatch<State = unknown>({
  action,
  nextState,
  prevState,
}: {
  action: AnyAction;
  nextState: State;
  prevState: State;
}): void {
  // Skip logging while running tests.
  if (import.meta.env?.MODE === "test") return;

  const type = getActionType(action);

  /* eslint-disable no-console */
  console.groupCollapsed(
    `%caction %c${type} %c@ ${new Date().toLocaleString()}`,
    "color: gray;",
    "color: inherit;",
    "color: gray;",
  );
  console.info("%cprev state", "color: gray;", prevState);
  console.info("%caction", "color: lightskyblue;", action);
  console.info("%cnext state", "color: lightgreen;", nextState);
  console.groupEnd();
  /* eslint-enable no-console */
}
