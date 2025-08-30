import { actionCreatorFactory } from "../action/fsa";
import { Store } from "../Store";
import type { AnyAction } from "../types";
import { reduceToProperty } from "../utils/mod";

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
    incrementOne: reduceToProperty("count", (count, payload: void) => ++count),
    decrementOne: reduceToProperty("count", (count, payload: void) => --count),
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
