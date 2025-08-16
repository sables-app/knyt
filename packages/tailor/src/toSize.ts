import {
  CSSLength,
  isCSSLength,
  type CSSLengthString,
  type PixelValue,
} from "./CSSLength";
import {
  CSSPercentage,
  isCSSPercentage,
  type CSSPercentageString,
} from "./CSSPercentage";

/**
 * Convert the given value into either a `CSSLength` or `CSSPercentage`.
 *
 * @throws If the value is not recognized.
 * @remarks Given number value are assumed to be pixel units.
 */
export function toSize(value: CSSLength): CSSLength;

export function toSize(value: CSSPercentage): CSSPercentage;

export function toSize(
  value: CSSLengthString.Strict,
  baseFontSizePx?: PixelValue,
): CSSLength;

export function toSize(value: CSSPercentageString.Strict): CSSPercentage;

/**
 * @deprecated Parsing CSS percentage values with a base font toSize is not supported.
 */
export function toSize(
  value: CSSPercentageString.Strict,
  baseFontSizePx: PixelValue,
): never;

export function toSize(
  value: string | number,
  baseFontSizePx: PixelValue,
): CSSLength;

export function toSize(
  value: string | number | undefined,
  baseFontSizePx: PixelValue,
): CSSLength | undefined;

export function toSize(value: string | number): CSSLength | CSSPercentage;

export function toSize(
  value: string | number | undefined,
): CSSLength | CSSPercentage | undefined;

export function toSize(
  value: CSSLength.RecognizedValue | CSSPercentage.RecognizedValue | undefined,
  baseFontSizePx?: PixelValue,
): CSSLength | CSSPercentage | undefined {
  if (isCSSLength(value) || isCSSPercentage(value)) {
    return value;
  }

  try {
    return CSSLength.from(value, baseFontSizePx);
  } catch (error) {
    if (error instanceof TypeError === false) {
      throw error;
    }
  }

  if (baseFontSizePx !== undefined) {
    throw new TypeError(
      `css.toSize: Unrecognized value: ${value} with baseFontSizePx: ${baseFontSizePx}`,
    );
  }

  try {
    return CSSPercentage.from(value);
  } catch (error) {
    if (error instanceof TypeError === false) {
      throw error;
    }
  }

  throw new TypeError(`css.toSize: Unrecognized value: ${value}`);
}
