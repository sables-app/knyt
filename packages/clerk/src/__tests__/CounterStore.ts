import { actionCreatorFactory } from "../action/fsa";
import { reduce } from "../reduce/mod";
import { Store } from "../Store";
import type { AnyAction } from "../types";

export type CounterState = {
  count: number;
};

const createAction = actionCreatorFactory("CounterStore");
const incrementBy = createAction<number>("incrementBy");

export class CounterStore extends Store<CounterState> {
  constructor() {
    super({ count: 0 });
  }

  // A bound action creator created from an external action creator; not recommended
  incrementBy = (num: number) => this.dispatch(incrementBy(num));

  // A bound action creator with a reducer
  decrementBy = this.createAction<number>("decrementBy", (state, action) => ({
    count: state.count - action.payload,
  }));

  // Bound action creators with reducers; recommended for most cases
  actions = this.createActions({
    incrementOne: reduce.toProp("count", (count, payload: void) => ++count),
    decrementOne: reduce.toProp("count", (count, payload: void) => --count),
  });

  reduce(state: CounterState, action: AnyAction): CounterState {
    switch (true) {
      case incrementBy.match(action):
        return { count: state.count + action.payload };
      default:
        return state;
    }
  }
}
