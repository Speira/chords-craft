/** Status types */
export type Status = "success" | "info" | "warning" | "danger";

/** Priority types */
export type Priority = "low" | "medium" | "high";

/** Log level types */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/** Sort direction types */
export type SortDirection = "asc" | "desc";

/** Define the basic type at once */
export type Primitive = string | number | boolean | bigint | symbol;

/** Define any plain object */
export type PlainObject<T = unknown> = Record<PropertyKey, T>;

/** Define any array */
export type AnyArray<T = unknown> = Array<T> | ReadonlyArray<T>;

/** Set all property as optional */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Define the values of any object or ReadonlyArray */
export type ValueOf<T> = T[keyof T];

/** Define the type of the key in the object */
export type KeyOf<T> = keyof T;

/** Define the type of the string key in the object */
export type StringKeyOf<T> = Extract<keyof T, string>;

/** Define the type of the item in the array */
export type ItemOf<T> = T extends AnyArray<infer U> ? U : never;

/** Nullable type */
export type Nullable<T> = T | null;

/** Define the type of the function */
export type FunctionType<
  In extends Array<unknown> = Array<unknown>,
  Out = unknown
> = (...args: In) => Out;

/** Deep array type */
export type DeepArrayType<T> = T extends Array<infer U>
  ? ItemOf<U>
  : T extends PlainObject
  ? { [K in keyof T]: DeepArrayType<T[K]> }
  : T;

/** Non-empty array */
export type NonEmptyArray<T> = [T, ...Array<T>];

/** Prettify object types in tooltips */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * DeepPartial<T>
 *
 * - Recursively makes properties optional
 * - Leaves functions and common built-ins intact
 * - Preserves readonly arrays as readonly
 */
export type DeepPartial<T> =
  // functions unchanged
  T extends (...args: Array<unknown>) => unknown
    ? T
    : // common built-ins unchanged (add more if you use them)
    T extends
        | Date
        | RegExp
        | Map<unknown, unknown>
        | Set<unknown>
        | WeakMap<WeakKey, unknown>
        | WeakSet<WeakKey>
    ? T
    : // arrays / tuples: make element DeepPartial, keep readonly
    T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : // plain objects
    T extends PlainObject
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/**
 * Define the nested key of the object
 *
 * @example
 *   NestedKey<{a: {b: string}}> => "a" | "a.b"
 *   - Recurse only into plain object-ish records; do not descend into arrays/functions/built-ins.
 */
export type NestedKey<T, Prefix extends string = ""> = {
  [K in StringKeyOf<T>]: T[K] extends ReadonlyArray<unknown>
    ? `${Prefix}${K}` // stop at arrays
    : T[K] extends (...args: Array<unknown>) => unknown
    ? `${Prefix}${K}` // stop at functions
    : T[K] extends
        | Date
        | RegExp
        | Map<unknown, unknown>
        | Set<unknown>
        | WeakMap<WeakKey, unknown>
        | WeakSet<WeakKey>
        | Promise<unknown>
    ? `${Prefix}${K}` // stop at common built-ins
    : T[K] extends PlainObject
    ? `${Prefix}${K}` | NestedKey<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[StringKeyOf<T>];

/**
 * Define the nested key of the object
 *
 * @example
 *   NestedKeyOf<{a: {b: string}}> => "a" | "a.b"
 *   - Recurse only into plain object-ish records; do not descend into arrays/functions/built-ins.
 */
export type NestedKeyOf<T> = T extends object
  ? {
      [Property in keyof T]:
        | `${Property & string}`
        | `${Property & string}.${NestedKeyOf<T[Property]>}`;
    }[keyof T]
  : never;

/**
 * Branded type (nominal-ish typing)
 *
 * - Using a unique symbol avoids accidental structural compatibility. Example:
 *   type UserId = Brand<string, "UserId">
 */
declare const __brand: unique symbol;
export type Brand<T, BrandName extends string> = T & {
  readonly [__brand]: BrandName;
};
