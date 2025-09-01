import { createSelector } from "./createSelector";
import * as selectors from "./selectors";

type Select = typeof createSelector & typeof selectors;

export const select = Object.assign(
  (...args: any[]) => createSelector(...args),
  selectors,
) as Select;
