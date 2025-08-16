import { isNonNullableObject } from "@knyt/artisan";

const PERCENTAGE_UNIT = "%";

/** @example 0.75 */
export type RatioDecimal = number;

/**
 * @example "50%"
 */
export type CSSPercentageString = string;

export namespace CSSPercentageString {
  export type Strict = `${number}${typeof PERCENTAGE_UNIT}`;
}

/**
 * Represents a CSS Percentage value.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/percentage | MDN CSS Length}
 */
export class CSSPercentage {
  /**
   * Convert the given value into a `CSSPercentage`.
   *
   * @throws If the value is not recognized.
   * @remarks Given number value are assumed to be ratio decimal.
   */
  public static from(value: CSSPercentage.RecognizedValue): CSSPercentage;

  public static from(
    value: CSSPercentage.RecognizedValue | undefined,
  ): CSSPercentage | undefined;

  public static from(
    value: CSSPercentage.RecognizedValue | undefined,
  ): CSSPercentage | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === "number") {
      return new CSSPercentage(value);
    }
    if (isCSSPercentage(value)) {
      return value;
    }
    if (value.endsWith(PERCENTAGE_UNIT)) {
      const ratioDecimal = parseFloat(value) / 100;

      return new CSSPercentage(ratioDecimal);
    }

    throw new TypeError(`CSSPercentage: Unrecognized value: ${value}`);
  }

  public static isPercentageString(
    value: unknown,
  ): value is CSSPercentageString.Strict {
    return (
      typeof value === "string" &&
      value.endsWith(PERCENTAGE_UNIT) &&
      !isNaN(parseFloat(value))
    );
  }

  /**
   * The value of the percentage represented in pixels.
   */
  private ratioDecimal: RatioDecimal;

  constructor(ratioDecimal: RatioDecimal) {
    this.ratioDecimal = ratioDecimal;
  }

  /**
   * Convert the percentage into a value using pixels.
   */
  public toRatioDecimalValue(): RatioDecimal {
    return this.ratioDecimal;
  }

  /**
   * Convert the percentage into a value using pixels.
   */
  public toPercentageValue(): number {
    return this.ratioDecimal * 100;
  }

  /**
   * Convert the percentage into a string with a "%" unit.
   */
  public pct(): CSSPercentageString {
    return `${this.toPercentageValue()}${PERCENTAGE_UNIT}`;
  }

  /**
   * Add this percentage to another percentage.
   */
  public plus(other: CSSPercentage.RecognizedValue): CSSPercentage {
    return this.math(other, (a, b) => a + b);
  }

  /**
   * Subtract another percentage from this percentage.
   */
  public minus(other: CSSPercentage.RecognizedValue): CSSPercentage {
    return this.math(other, (a, b) => a - b);
  }

  /**
   * Multiply this percentage by another percentage or a number.
   */
  public times(other: CSSPercentage.RecognizedValue): CSSPercentage {
    return this.math(other, (a, b) => a * b);
  }

  /**
   * Get the maximum value between this percentage and another percentage.
   */
  public max(other: CSSPercentage.RecognizedValue): CSSPercentage {
    return this.math(other, (a, b) => Math.max(a, b));
  }

  /**
   * Get the minimum value between this percentage and another percentage.
   */
  public min(other: CSSPercentage.RecognizedValue): CSSPercentage {
    return this.math(other, (a, b) => Math.min(a, b));
  }

  /**
   * Divide this percentage by another percentage or a number.
   */
  public dividedBy(
    other: CSSPercentage.RecognizedValue,
    rounding: "floor" | "ceil" = "floor",
  ): CSSPercentage {
    return this.math(other, (pixelValueA, pixelValueB) => {
      return Math[rounding](pixelValueA / pixelValueB);
    });
  }

  /**
   * Enables automatic type coercion when using arithmetic operators.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf | MDN Primitive coercion}
   */
  public valueOf(): RatioDecimal {
    return this.toRatioDecimalValue();
  }

  /**
   * Enables automatic type coercion into strings.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString | MDN Primitive coercion}
   */
  public toString(): string {
    return this.pct();
  }

  /**
   * Perform a mathematical operation on this percentage and another percentage.
   */
  private math(
    other: CSSPercentage.RecognizedValue,
    operation: (
      pixelValueA: RatioDecimal,
      pixelValueB: RatioDecimal,
    ) => RatioDecimal,
  ): CSSPercentage {
    return new CSSPercentage(
      operation(
        this.toRatioDecimalValue(),
        CSSPercentage.from(other).toRatioDecimalValue(),
      ),
    );
  }

  get __KnytCSSPercentage() {
    return true as const;
  }
}

export namespace CSSPercentage {
  /**
   * Recognized input for CSS percentage values.
   */
  export type RecognizedValue =
    | RatioDecimal
    | CSSPercentageString
    | CSSPercentage;
}

export function isCSSPercentage(value: unknown): value is CSSPercentage {
  return (
    isNonNullableObject(value) &&
    "__KnytCSSPercentage" in value &&
    value.__KnytCSSPercentage === true
  );
}
