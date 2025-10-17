import { ValueSets } from "./generated/ValueSets.ts";

export type DataGlobalAttributes = {
  [k in `data-${string}`]: ValueSets["default"];
};
