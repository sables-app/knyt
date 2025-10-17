import { reduce } from "../reduce/mod.ts";
import { select } from "../select/mod.ts";
import { Store } from "../Store.ts";

export function createTheatreStore() {
  // import { reduce, Store, select } from "knyt";

  type Attendee = string;
  type State = {
    attendees: readonly Attendee[];
    latestError?: Error;
  };

  const theatre = new Store<State>({ attendees: [] });

  /**
   * A reducer that checks if an attendee is already registered
   */
  const hasAttendee = reduce.define<State, Attendee, boolean>(
    (state, action) => {
      return state.attendees.includes(action.payload);
    },
  );
  /**
   * A reducer that sets an error for when an attendee is duplicate
   */
  const setDuplicateError = reduce.define<State, Attendee>((state, action) =>
    reduce.propUpdate(
      state,
      "latestError",
      new Error(`Attendee "${action.payload}" already exists.`),
    ),
  );
  /**
   * A reducer that sets an error for when an attendee is missing
   */
  const setNotFoundError = reduce.define<State, Attendee>((state, action) =>
    reduce.propUpdate(
      state,
      "latestError",
      new Error(`Attendee "${action.payload}" does not exist.`),
    ),
  );
  /**
   * A reducer that clears the latest error
   */
  const clearLatestError = reduce.define<State, void>(
    reduce.toProp("latestError", () => undefined),
  );
  /**
   * A reducer that appends an attendee to the list
   */
  const appendAttendee = reduce.define<State, Attendee>(
    reduce.toProp("attendees", reduce.itemAppend<Attendee>),
  );
  /**
   * A reducer that registers an attendee only if they are not already registered.
   * If they are already registered, it sets a duplicate error.
   */
  const registerUniqueAttendee = reduce.withBranch(
    hasAttendee,
    setDuplicateError,
    appendAttendee,
  );
  /**
   * A reducer that unregisters an attendee
   */
  const unregisterAttendee = reduce.define<State, Attendee>(
    reduce.toProp("attendees", (attendees, payload) =>
      reduce.itemRemove(attendees, (item) => item === payload),
    ),
  );
  /**
   * A reducer that attempts to unregister an attendee, or sets an error if they are not found
   */
  const strictUnregisterAttendee = reduce.withBranch(
    hasAttendee,
    unregisterAttendee,
    setNotFoundError,
  );
  /**
   * A reducer that safely registers an attendee, handing errored actions,
   * by setting the latest error in the state.
   */
  const safeRegisterUniqueAttendee = reduce.withErrorBranch(
    reduce.toProp("latestError"),
    registerUniqueAttendee,
  );

  const actions = theatre.createActions({
    register: safeRegisterUniqueAttendee,
    unregister: strictUnregisterAttendee,
    dismissError: clearLatestError,
  });

  const accessor = theatre.createAccessor({
    itemCount: select(theatre.select.attendees).combine(select.count),
    latestError: theatre.select.latestError,
  });

  return { actions, accessor };
}
