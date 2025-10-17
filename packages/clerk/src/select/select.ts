import { createSelector } from "./createSelector.ts";
import * as selectors from "./selectors.ts";

type Select = typeof createSelector & typeof selectors;

export const select = Object.assign(
  (...args: any[]) => createSelector(...args),
  selectors,
) as Select;
