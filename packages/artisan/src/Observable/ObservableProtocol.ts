/**
 * Returns the symbol for the observable protocol.
 *
 * @remarks
 *
 * This symbol is used to identify objects that conform to the observable protocol,
 * allowing them to be used with RxJS and other libraries that support the observable pattern.
 */
function getSymbolForObservableInterop<T>(): symbol {
  type SymbolNamespace = Record<string, symbol | undefined> & {
    for(key: string): symbol;
  };

  const $Symbol = globalThis.Symbol as unknown as SymbolNamespace;
  const symbolForObservableInterop =
    $Symbol.observable ?? $Symbol.for("knyt.artisan.observable");

  if (!$Symbol.observable && !Object.isFrozen($Symbol)) {
    $Symbol.observable = symbolForObservableInterop;
  }

  return symbolForObservableInterop;
}

/**
 * @internal scope: workspace
 */
export const OBSERVABLE_SYMBOL = getSymbolForObservableInterop();

/**
 * @internal scope: workspace
 */
export const OBSERVABLE_PROPERTY_NAME = "@@observable";

declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}
