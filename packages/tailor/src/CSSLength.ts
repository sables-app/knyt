import { isNonNullableObject } from "@knyt/artisan";

import { DEFAULT_BASE_FONT_SIZE_PX } from "./constants";
import { CSSPercentage, isCSSPercentage } from "./CSSPercentage";

/**
 * @example 16
 */
export type PixelValue = number;

/**
 * @example 1
 */
export type RemValue = number;

/**
 * @example "16px" | "1rem"
 */
export type CSSLengthString = string;

export namespace CSSLengthString {
  /**
   * A CSS length string that is strictly a pixel value.
   *
   * @example "16px"
   */
  export type Pixels = `${PixelValue}${CSSLength.Unit.Pixels}`;

  /**
   * A CSS length string that is strictly a rem value.
   *
   * @example "1rem"
   */
  export type Rem = `${RemValue}${CSSLength.Unit.Rem}`;

  /**
   * A CSS length string that is either a pixel or rem value.
   *
   * @example "16px" | "1rem"
   */
  export type Strict = Pixels | Rem;
}

/**
 * Represents a CSS length value.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/length | MDN CSS Length}
 */
export class CSSLength {
  /**
   * Convert the given value into a `CSSLength`.
   *
   * @throws If the value is not recognized.
   * @remarks Given number value are assumed to be pixel units.
   */
  static from(
    value: CSSLength.RecognizedValue,
    baseFontSizePx?: PixelValue,
  ): CSSLength;
  // We're using a function overload to allow for `undefined`
  // values to be passed through, without having to use the
  // `CSSLength | undefined` for the return type for all
  // function calls.
  static from(
    value: CSSLength.RecognizedValue | undefined,
    baseFontSizePx?: PixelValue,
  ): CSSLength | undefined;
  static from(
    value: CSSLength.RecognizedValue,
    baseFontSizePx: PixelValue = DEFAULT_BASE_FONT_SIZE_PX,
  ): CSSLength | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === "number") {
      return new CSSLength(value, baseFontSizePx);
    }
    if (isCSSLength(value)) {
      return value;
    }
    if (value.endsWith(CSSLength.Unit.Pixels)) {
      return new CSSLength(parseFloat(value), baseFontSizePx);
    }
    if (value.endsWith(CSSLength.Unit.Rem)) {
      const pixelValue = parseFloat(value) * baseFontSizePx;

      return new CSSLength(pixelValue, baseFontSizePx);
    }

    throw new Error(`CSSLength: Unrecognized value: ${value}`);
  }

  /**
   * The value of the length represented in pixels.
   */
  #pixelValue: PixelValue;

  /**
   * Default base font size in pixels.
   * @defaultValue 16
   * @remarks This value is used to convert between pixels and rems.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font-size | MDN font-size}
   */
  #baseFontSizePx: PixelValue;

  constructor(
    pixelValue: PixelValue,
    baseFontSizePx: PixelValue = DEFAULT_BASE_FONT_SIZE_PX,
  ) {
    this.#pixelValue = pixelValue;
    this.#baseFontSizePx = baseFontSizePx;
  }

  /**
   * Convert the length into a value using pixels.
   */
  toPixelValue(): PixelValue {
    return this.#pixelValue;
  }

  /**
   * Convert the length into a value using the base font size.
   */
  toRemValue(): RemValue {
    return this.#pixelValue / this.#baseFontSizePx;
  }

  /**
   * Convert the length into a string with a "px" unit.
   */
  px(): CSSLengthString {
    return `${this.toPixelValue()}${CSSLength.Unit.Pixels}`;
  }

  /**
   * Convert the length into a string with a "rem" unit.
   */
  rem(): CSSLengthString {
    return `${this.toRemValue()}${CSSLength.Unit.Rem}`;
  }

  /**
   * Convert the length into a value using the given unit.
   */
  toValue(unit: CSSLength.UnitType): number {
    switch (unit) {
      case CSSLength.Unit.Pixels:
        return this.toPixelValue();
      case CSSLength.Unit.Rem:
        return this.toRemValue();
      default:
        throw new Error(`CSSLength: Unrecognized unit: ${unit}`);
    }
  }

  /**
   * Convert the length into a string with the given unit.
   */
  toLengthString(unit: CSSLength.UnitType): CSSLengthString {
    switch (unit) {
      case CSSLength.Unit.Pixels:
        return this.px();
      case CSSLength.Unit.Rem:
        return this.rem();
      default:
        throw new Error(`CSSLength: Unrecognized unit: ${unit}`);
    }
  }

  /**
   * Add this length to another length.
   */
  plus(other: CSSLength.RecognizedValue): CSSLength {
    return this.#math(other, (a, b) => a + b);
  }

  /**
   * Subtract another length from this length.
   */
  minus(other: CSSLength.RecognizedValue): CSSLength {
    return this.#math(other, (a, b) => a - b);
  }

  /**
   * Multiply this length by another length or a number.
   */
  times(other: CSSLength.RecognizedValue | CSSPercentage): CSSLength {
    return this.#math(other, (a, b) => a * b);
  }

  /**
   * Get the maximum value between this length and another length.
   */
  max(other: CSSLength.RecognizedValue): CSSLength {
    return this.#math(other, (a, b) => Math.max(a, b));
  }

  /**
   * Get the minimum value between this length and another length.
   */
  min(other: CSSLength.RecognizedValue): CSSLength {
    return this.#math(other, (a, b) => Math.min(a, b));
  }

  /**
   * Divide this length by another length or a number.
   *
   * @remarks
   *
   * The result of division is always rounded,
   * because sub-pixel values are not allowed.
   */
  dividedBy(
    other: CSSLength.RecognizedValue | CSSPercentage,
    rounding: "floor" | "ceil" | "round" = "floor",
  ): CSSLength {
    return this.#math(other, (pixelValueA, pixelValueB) => {
      return Math[rounding](pixelValueA / pixelValueB);
    });
  }

  #round(rounding: "floor" | "ceil" | "round"): CSSLength {
    return new CSSLength(
      Math[rounding](this.toPixelValue()),
      this.#baseFontSizePx,
    );
  }

  round(): CSSLength {
    return this.#round("round");
  }

  floor(): CSSLength {
    return this.#round("floor");
  }

  ceil(): CSSLength {
    return this.#round("ceil");
  }

  /**
   * Rounds up to the nearest even number.
   *
   * @alpha
   */
  even(): CSSLength {
    return new CSSLength(
      Math.round(this.toPixelValue() / 2) * 2,
      this.#baseFontSizePx,
    );
  }

  /**
   * Validates the pixel value of the length.
   *
   * @returns An array of error messages.
   */
  validate({ min, max }: CSSLength.ValidationConfig = {}): string[] {
    const pixelValue = this.#pixelValue;
    const errors: string[] = [];

    if (isNaN(pixelValue)) {
      errors.push("Pixel value is not a number.");
    }
    if (!isFinite(pixelValue)) {
      errors.push("Pixel value is not finite.");
    }
    if (min !== undefined) {
      const minLength = CSSLength.from(min);

      if (!minLength.isValid()) {
        errors.push(`Min length is invalid: ${min}`);
      } else if (pixelValue < minLength.toPixelValue()) {
        errors.push(`Pixel value of ${pixelValue} is less than ${min}.`);
      }
    }
    if (max !== undefined) {
      const maxLength = CSSLength.from(max);

      if (!maxLength.isValid()) {
        errors.push(`Max length is invalid: ${max}`);
      } else if (pixelValue > maxLength.toPixelValue()) {
        errors.push(`Pixel value of ${pixelValue} is greater than ${max}.`);
      }
    }

    return errors;
  }

  isValid(config?: CSSLength.ValidationConfig): boolean {
    return this.validate(config).length === 0;
  }

  assertValidity(config?: CSSLength.ValidationConfig): void {
    const errors = this.validate(config);

    if (errors.length > 0) {
      throw new Error(`CSSLength: ${errors.join(" ")}`);
    }
  }

  /**
   * Log validation errors to the console,
   * and returns whether the length is valid.
   */
  checkValidity(config?: CSSLength.ValidationConfig): boolean {
    const errors = this.validate(config);

    if (errors.length > 0) {
      console.error(`CSSLength: ${errors.join(" ")}`);

      return false;
    }

    return true;
  }

  /**
   * Enables automatic type coercion when using arithmetic operators.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf | MDN Primitive coercion}
   */
  valueOf(): PixelValue {
    return this.toPixelValue();
  }

  /**
   * Enables automatic type coercion into strings.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString | MDN Primitive coercion}
   */
  toString(): string {
    return this.px();
  }

  /**
   * Enables automatic type coercion into numbers or strings.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive | MDN Symbol.toPrimitive}
   */
  [Symbol.toPrimitive](hint: string) {
    switch (hint) {
      case "number":
        return this.toPixelValue();
      case "string":
        return this.px();
      default:
        return this.toPixelValue();
    }
  }

  /**
   * Perform a mathematical operation on this length and another length.
   */
  #math(
    other: CSSLength.RecognizedValue | CSSPercentage,
    operation: (pixelValueA: PixelValue, pixelValueB: PixelValue) => PixelValue,
  ): CSSLength {
    const otherValue = isCSSPercentage(other)
      ? other.toRatioDecimalValue()
      : CSSLength.from(other).toPixelValue();

    return new CSSLength(
      operation(this.toPixelValue(), otherValue),
      this.#baseFontSizePx,
    );
  }

  get __KnytCSSLength() {
    return true as const;
  }
}

export namespace CSSLength {
  /**
   * Recognized CSS length units.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/length | MDN CSS length}
   */
  export enum Unit {
    Pixels = "px",
    Rem = "rem",
  }

  export type UnitType = `${Unit}`;

  /**
   * Recognized input for CSS length values.
   */
  export type RecognizedValue = PixelValue | CSSLengthString | CSSLength;

  export type ValidationConfig = {
    min?: RecognizedValue;
    max?: RecognizedValue;
  };
}

export function isCSSLength(value: unknown): value is CSSLength {
  return (
    isNonNullableObject(value) &&
    "__KnytCSSLength" in value &&
    value.__KnytCSSLength === true
  );
}
