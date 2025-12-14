import { Typeguards } from "./typeguards";
import type { DeepPartial, PlainObject } from "./types";

/**
 * ObjectUtils
 *
 * Utility functions for objects
 *
 * @example
 *   // keysToString
 *   const object1 = { header: true, blue: 3, warning: false };
 *   const result1 = ObjectUtils.keysToString(object1); // "header blue"
 *   const options = { prefix: 'pre_', suffix: '_suf' };
 *   const result2 = ObjectUtils.keysToString(object1, options); // "pre_header_suf pre_blue_suf"
 *
 *   // displayValue
 *   const item = { name: 'Alice', age: 30, active: true, admin: false };
 *   ObjectUtils.displayValue(item, 'name'); // "Alice"
 *
 *   // mergeDeep
 *   const a = { foo: { bar: 1, baz: 2 }, arr: [1, 2] };
 *   const b = { foo: { bar: 3 }, arr: [3] };
 *   const merged = ObjectUtils.mergeDeep(a, b);
 *   // merged: { foo: { bar: 3, baz: 2 }, arr: [3] }
 *
 *   // mergeDeepPartial
 *   const a = { foo: { bar: 1, baz: 2 }, arr: [1, 2] };
 *   const b = { foo: { bar: 3 }, arr: [3] };
 *   const merged = ObjectUtils.mergeDeepPartial(a, b);
 *   // merged: { foo: { bar: 3, baz: 2 }, arr: [3] }
 */
export default class ObjectUtils {
  /**
   * Converts the keys of an object to a string.
   *
   * @example
   *   ObjectUtils.keysToString({ a: 1, b: 2 }); // "a b"
   */
  static keysToString(
    obj: PlainObject,
    options?: {
      prefix?: string;
      suffix?: string;
      join?: string;
    }
  ) {
    return Object.keys(obj)
      .reduce(
        (acc, cur) =>
          obj[cur]
            ? acc + ` ${options?.prefix || ""}${cur}${options?.suffix || ""}`
            : acc,
        ""
      )
      .trim();
  }

  /**
   * Displays the value of an object key.
   *
   * @example
   *   ObjectUtils.displayValue({ a: 1, b: 2 }, 'a'); // 1
   */
  static displayValue(
    item: object,
    key: string,
    booleanAsValue: [string, string] = ["yes", "no"]
  ): string {
    if (Typeguards.checkIsKeyof(item, key)) {
      const value = item[key];
      if (["string", "number"].includes(typeof value)) {
        return value;
      }
      if (typeof value === "boolean") {
        return value ? booleanAsValue[0] : booleanAsValue[1];
      }
    }
    return "";
  }

  /**
   * Picks the keys from an object.
   *
   * @example
   *   ObjectUtils.pick({ a: 1, b: 2 }, ['a']); // { a: 1 }
   */
  static pick<T extends object = object>(
    obj: T,
    keys: Array<keyof T>
  ): Partial<T> {
    return keys.reduce((acc, key) => {
      if (Typeguards.checkIsKeyof(obj, key)) {
        acc[key] = obj[key];
      }
      return acc;
    }, {} as Partial<T>);
  }

  /**
   * Merges multiple objects deeply, only updating the target object with the
   * values from the modifiers.
   *
   * @example
   *   ObjectUtils.mergeDeepPartial({ a: 1, b: 2 }, { a: 3, c: 4 }); // { a: 3, b: 2, c: 4 }
   *   ObjectUtils.mergeDeepPartial(
   *     { a: 1, b: 2 },
   *     { a: 3, c: 4 },
   *     { a: 5, d: 6 },
   *   ); // { a: 5, b: 2, c: 4, d: 6 }
   */
  static mergeDeepPartial<T extends object = object, K extends object = object>(
    target: T,
    ...modifiers: Array<K | DeepPartial<T>>
  ): K extends DeepPartial<T> ? T : T & K {
    if (!modifiers.length) {
      return target as K extends DeepPartial<T> ? T : T & K;
    }
    let result = { ...target };
    for (const modifier of modifiers) {
      if (Typeguards.checkIsPlainObject(modifier)) {
        Object.keys(modifier).forEach((key) => {
          if (Typeguards.checkIsKeyof(modifier, key)) {
            const targetValue = Typeguards.checkIsKeyof(result, key)
              ? result[key]
              : undefined;
            const modifierValue = modifier[key];
            if (Typeguards.checkIsPlainObject(modifierValue)) {
              if (Typeguards.checkIsPlainObject(targetValue)) {
                result = {
                  ...result,
                  [key]: ObjectUtils.mergeDeepPartial(
                    targetValue,
                    modifierValue
                  ),
                };
              } else {
                result = {
                  ...result,
                  [key]: modifierValue as T[string & keyof T],
                };
              }
            } else if (modifierValue !== undefined) {
              result = {
                ...result,
                [key]: modifierValue as T[string & keyof T],
              };
            }
          }
        });
      }
    }

    return result as K extends DeepPartial<T> ? T : T & K;
  }
}
