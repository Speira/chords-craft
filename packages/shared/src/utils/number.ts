import type { Brand } from "./types";

export type SafePrice = Brand<number, "SafePrice">;
export type UnsafePrice = Brand<number, "UnsafePrice">;

/**
 * Utility class for common number operations.
 *
 * Methods include:
 *
 * - FormatPrice: Formats a number as a currency string.
 * - ToIntPrice: Converts a price to an integer price to make precise calculations.
 * - ToFloatPrice: Converts an integer price to a price to be displayed to the user.
 * - FormatNumber: Formats a number as a string.
 * - FormatPercent: Formats a number as a percentage string.
 * - Round: Rounds a number to a specified number of decimal places.
 * - Clamp: Clamps a number between a minimum and maximum value.
 * - Random: Generates a random number between a minimum and maximum value.
 * - RandomInt: Generates a random integer between a minimum and maximum value.
 * - CheckIsEven: Checks if a number is even.
 * - CheckIsOdd: Checks if a number is odd.
 * - Factorial: Calculates the factorial of a number.
 * - Fibonacci: Calculates the Fibonacci number of a number.
 */
export class NumberUtils {
  /**
   * Formats a number as a currency string.
   *
   * @example
   *   NumberUtils.formatPrice(100); // $100.00
   */
  static formatPrice(amount: number, currency = "USD", locale = "en-US"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Converts a price to an integer price to make precise calculations. The result is an
   * integer number.
   *
   * @example
   *   NumberUtils.toIntPrice(100.123456); // 10012
   *
   * @see toFloatPrice to revert the conversion
   */
  static toIntPrice(price: number): number {
    return Number((price * 100).toFixed(0));
  }

  /**
   * Converts an integer price to a price to be displayed to the user. The result is a
   * float number with two decimal places.
   *
   * @example
   *   NumberUtils.toFloatPrice(10012); // 100.123456
   *
   * @see toIntPrice to convert the price to an integer
   */
  static toFloatPrice(price: number): number {
    return price / 100;
  }

  static formatSafePrice(price: number): string {
    return NumberUtils.formatPrice(price);
  }

  /**
   * Formats a number as a string.
   *
   * @example
   *   NumberUtils.formatNumber(100); // 100
   */
  static formatNumber(value: number, locale = "en-US"): string {
    return new Intl.NumberFormat(locale).format(value);
  }

  /**
   * Formats a number as a percentage string.
   *
   * @example
   *   NumberUtils.formatPercent(100); // 100%
   */
  static formatPercent(value: number, locale = "en-US"): string {
    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value / 100);
  }

  /**
   * Rounds a number to a specified number of decimal places.
   *
   * @example
   *   NumberUtils.round(100.123456); // 100.12
   */
  static round(value: number, decimals = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Clamps a number between a minimum and maximum value.
   *
   * @example
   *   NumberUtils.clamp(10, 0, 100); // 10
   *   NumberUtils.clamp(-10, 0, 100); // 0
   *   NumberUtils.clamp(110, 0, 100); // 100
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Generates a random number between a minimum and maximum value.
   *
   * @example
   *   NumberUtils.random(0, 100); // 50
   */
  static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generates a random integer between a minimum and maximum value.
   *
   * @example
   *   NumberUtils.randomInt(0, 100); // 50
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Checks if a number is even.
   *
   * @example
   *   NumberUtils.checkIsEven(2); // true
   */
  static checkIsEven(value: number): boolean {
    return value % 2 === 0;
  }

  /**
   * Checks if a number is odd.
   *
   * @example
   *   NumberUtils.checkIsOdd(1); // true
   */
  static checkIsOdd(value: number): boolean {
    return value % 2 !== 0;
  }

  /**
   * Calculates the factorial of a number.
   *
   * @example
   *   NumberUtils.factorial(5); // 120
   */
  static factorial(n: number): number {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    return n * NumberUtils.factorial(n - 1);
  }

  /**
   * Calculates the Fibonacci number of a number.
   *
   * @example
   *   NumberUtils.fibonacci(5); // 5
   */
  static fibonacci(n: number): number {
    if (n < 0) return NaN;
    if (n === 0) return 0;
    if (n === 1) return 1;
    return NumberUtils.fibonacci(n - 1) + NumberUtils.fibonacci(n - 2);
  }
}
