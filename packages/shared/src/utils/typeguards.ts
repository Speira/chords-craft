import type { Primitive } from "./types";

/**
 * Typeguard class for runtime type checking.
 *
 * @example
 *   ```ts
 *   Typeguards.checkIsArray([1, 2, 3]); // true
 *   Typeguards.checkIsBoolean(true); // true
 *   Typeguards.checkIsClass(class { }); // true
 *   ``````ts
 *   Typeguards.checkIsKeyof({ key: 1 }, 'key'); // true
 *   ``````ts
 *   Typeguards.checkIsNumber(1); // true
 *   ``````ts
 *   Typeguards.checkIsPlainObject({ key: 1 }); // true
 *   ``````ts
 *   Typeguards.checkIsPrimitive('string'); // true
 *   ``````ts
 *   Typeguards.checkIsString('string'); // true
 *   ```;
 */
export class Typeguards {
  static checkIsArray<T = unknown>(arg: unknown): arg is Array<T> {
    return Array.isArray(arg);
  }

  static checkIsBoolean(arg: unknown): arg is boolean {
    return typeof arg === "boolean";
  }

  static checkIsClass(item: unknown): item is new (...args: Array<unknown>) => unknown {
    return (
      typeof item === "function" &&
      /^class\s/.test(Function.prototype.toString.call(item))
    );
  }

  static checkIsFunction(item: unknown): item is (...args: Array<unknown>) => unknown {
    return typeof item === "function" && !this.checkIsClass(item);
  }

  static checkIsKeyof<T extends object = object>(
    obj: T,
    key: PropertyKey,
  ): key is keyof T {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  static checkIsNumber(arg: unknown): arg is number {
    return typeof arg === "number" && !Number.isNaN(arg);
  }

  static checkIsPlainObject(arg: unknown): arg is Record<PropertyKey, unknown> {
    if (arg === null || typeof arg !== "object") return false;
    const proto = Object.getPrototypeOf(arg);
    return proto === Object.prototype || proto === null; // allow null-proto
  }

  static checkIsPrimitive(arg: unknown): arg is Primitive {
    return (
      this.checkIsString(arg) ||
      this.checkIsNumber(arg) ||
      this.checkIsBoolean(arg) ||
      typeof arg === "symbol" ||
      typeof arg === "bigint"
    );
  }

  static checkIsString(arg: unknown): arg is string {
    return typeof arg === "string";
  }
}
