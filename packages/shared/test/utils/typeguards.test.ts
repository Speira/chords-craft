import { describe, expect, it } from "vitest";

import { Typeguards } from "../../src/utils/typeguards";

describe("Typeguards test suite", () => {
  describe("checkIsArray", () => {
    it("Should return true for arrays", () => {
      expect(Typeguards.checkIsArray([])).toBe(true);
      expect(Typeguards.checkIsArray([1, 2, 3])).toBe(true);
      expect(Typeguards.checkIsArray(["a", "b", "c"])).toBe(true);
      expect(Typeguards.checkIsArray([null, undefined])).toBe(true);
      expect(Typeguards.checkIsArray(new Array(10))).toBe(true);
    });

    it("Should return false for non-arrays", () => {
      expect(Typeguards.checkIsArray({})).toBe(false);
      expect(Typeguards.checkIsArray("array")).toBe(false);
      expect(Typeguards.checkIsArray(123)).toBe(false);
      expect(Typeguards.checkIsArray(null)).toBe(false);
      expect(Typeguards.checkIsArray(undefined)).toBe(false);
      expect(Typeguards.checkIsArray({ length: 0 })).toBe(false);
    });

    it("Should work with array-like objects", () => {
      const arrayLike = { 0: "a", 1: "b", length: 2 };
      expect(Typeguards.checkIsArray(arrayLike)).toBe(false);
    });
  });

  describe("checkIsBoolean", () => {
    it("Should return true for booleans", () => {
      expect(Typeguards.checkIsBoolean(true)).toBe(true);
      expect(Typeguards.checkIsBoolean(false)).toBe(true);
      expect(Typeguards.checkIsBoolean(Boolean(1))).toBe(true);
      expect(Typeguards.checkIsBoolean(Boolean(0))).toBe(true);
    });

    it("Should return false for non-booleans", () => {
      expect(Typeguards.checkIsBoolean(1)).toBe(false);
      expect(Typeguards.checkIsBoolean(0)).toBe(false);
      expect(Typeguards.checkIsBoolean("true")).toBe(false);
      expect(Typeguards.checkIsBoolean("false")).toBe(false);
      expect(Typeguards.checkIsBoolean(null)).toBe(false);
      expect(Typeguards.checkIsBoolean(undefined)).toBe(false);
      expect(Typeguards.checkIsBoolean({})).toBe(false);
    });
  });

  describe("checkIsClass", () => {
    it("Should return true for user-defined classes", () => {
      class TestClass {}
      class AnotherClass {
        constructor() {}
      }
      expect(Typeguards.checkIsClass(TestClass)).toBe(true);
      expect(Typeguards.checkIsClass(AnotherClass)).toBe(true);
    });

    it("Should return false for built-in classes", () => {
      // Built-in classes are implemented natively and don't match the regex
      expect(Typeguards.checkIsClass(Date)).toBe(false);
      expect(Typeguards.checkIsClass(Error)).toBe(false);
      expect(Typeguards.checkIsClass(Array)).toBe(false);
    });

    it("Should return false for regular functions", () => {
      function regularFunction() {}
      const arrowFunction = () => {};
      const functionExpression = function () {};

      expect(Typeguards.checkIsClass(regularFunction)).toBe(false);
      expect(Typeguards.checkIsClass(arrowFunction)).toBe(false);
      expect(Typeguards.checkIsClass(functionExpression)).toBe(false);
    });

    it("Should return false for non-functions", () => {
      expect(Typeguards.checkIsClass({})).toBe(false);
      expect(Typeguards.checkIsClass("class")).toBe(false);
      expect(Typeguards.checkIsClass(123)).toBe(false);
      expect(Typeguards.checkIsClass(null)).toBe(false);
      expect(Typeguards.checkIsClass(undefined)).toBe(false);
    });

    it("Should return false for class instances", () => {
      class TestClass {}
      const instance = new TestClass();
      expect(Typeguards.checkIsClass(instance)).toBe(false);
    });
  });

  describe("checkIsFunction", () => {
    it("Should return true for functions", () => {
      function regularFunction() {}
      const arrowFunction = () => {};
      const functionExpression = function () {};
      const asyncFunction = async () => {};

      expect(Typeguards.checkIsFunction(regularFunction)).toBe(true);
      expect(Typeguards.checkIsFunction(arrowFunction)).toBe(true);
      expect(Typeguards.checkIsFunction(functionExpression)).toBe(true);
      expect(Typeguards.checkIsFunction(asyncFunction)).toBe(true);
    });

    it("Should return false for classes", () => {
      class TestClass {}
      expect(Typeguards.checkIsFunction(TestClass)).toBe(false);
    });

    it("Should return false for non-functions", () => {
      expect(Typeguards.checkIsFunction({})).toBe(false);
      expect(Typeguards.checkIsFunction("function")).toBe(false);
      expect(Typeguards.checkIsFunction(123)).toBe(false);
      expect(Typeguards.checkIsFunction(null)).toBe(false);
      expect(Typeguards.checkIsFunction(undefined)).toBe(false);
    });
  });

  describe("checkIsKeyof", () => {
    it("Should return true for existing keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(Typeguards.checkIsKeyof(obj, "a")).toBe(true);
      expect(Typeguards.checkIsKeyof(obj, "b")).toBe(true);
      expect(Typeguards.checkIsKeyof(obj, "c")).toBe(true);
    });

    it("Should return false for non-existing keys", () => {
      const obj = { a: 1, b: 2 };
      expect(Typeguards.checkIsKeyof(obj, "c")).toBe(false);
      expect(Typeguards.checkIsKeyof(obj, "d")).toBe(false);
      expect(Typeguards.checkIsKeyof(obj, "toString")).toBe(false);
    });

    it("Should work with numeric keys", () => {
      const obj = { 0: "a", 1: "b", 2: "c" };
      expect(Typeguards.checkIsKeyof(obj, 0)).toBe(true);
      expect(Typeguards.checkIsKeyof(obj, 1)).toBe(true);
      expect(Typeguards.checkIsKeyof(obj, 3)).toBe(false);
    });

    it("Should work with symbol keys", () => {
      const sym1 = Symbol("test");
      const sym2 = Symbol("other");
      const obj = { [sym1]: "value" };

      expect(Typeguards.checkIsKeyof(obj, sym1)).toBe(true);
      expect(Typeguards.checkIsKeyof(obj, sym2)).toBe(false);
    });

    it("Should not return true for inherited properties", () => {
      const obj = { a: 1 };
      expect(Typeguards.checkIsKeyof(obj, "toString")).toBe(false);
      expect(Typeguards.checkIsKeyof(obj, "hasOwnProperty")).toBe(false);
    });

    it("Should work with arrays", () => {
      const arr = ["a", "b", "c"];
      expect(Typeguards.checkIsKeyof(arr, 0)).toBe(true);
      expect(Typeguards.checkIsKeyof(arr, 1)).toBe(true);
      expect(Typeguards.checkIsKeyof(arr, 5)).toBe(false);
      expect(Typeguards.checkIsKeyof(arr, "length")).toBe(true);
    });
  });

  describe("checkIsNumber", () => {
    it("Should return true for numbers", () => {
      expect(Typeguards.checkIsNumber(0)).toBe(true);
      expect(Typeguards.checkIsNumber(1)).toBe(true);
      expect(Typeguards.checkIsNumber(-1)).toBe(true);
      expect(Typeguards.checkIsNumber(3.14)).toBe(true);
      expect(Typeguards.checkIsNumber(Infinity)).toBe(true);
      expect(Typeguards.checkIsNumber(-Infinity)).toBe(true);
    });

    it("Should return false for NaN", () => {
      expect(Typeguards.checkIsNumber(NaN)).toBe(false);
      expect(Typeguards.checkIsNumber(Number.NaN)).toBe(false);
      expect(Typeguards.checkIsNumber(0 / 0)).toBe(false);
    });

    it("Should return false for non-numbers", () => {
      expect(Typeguards.checkIsNumber("123")).toBe(false);
      expect(Typeguards.checkIsNumber("0")).toBe(false);
      expect(Typeguards.checkIsNumber(null)).toBe(false);
      expect(Typeguards.checkIsNumber(undefined)).toBe(false);
      expect(Typeguards.checkIsNumber({})).toBe(false);
      expect(Typeguards.checkIsNumber(true)).toBe(false);
    });
  });

  describe("checkIsObject", () => {
    it("Should return true for objects", () => {
      expect(Typeguards.checkIsObject({})).toBe(true);
      expect(Typeguards.checkIsObject({ a: 1 })).toBe(true);
      expect(Typeguards.checkIsObject(new Date())).toBe(true);
      expect(Typeguards.checkIsObject(new Error())).toBe(true);
      expect(Typeguards.checkIsObject(/regex/)).toBe(true);
    });

    it("Should return false for null", () => {
      expect(Typeguards.checkIsObject(null)).toBe(false);
    });

    it("Should return false for arrays", () => {
      expect(Typeguards.checkIsObject([])).toBe(false);
      expect(Typeguards.checkIsObject([1, 2, 3])).toBe(false);
    });

    it("Should return false for primitives", () => {
      expect(Typeguards.checkIsObject("string")).toBe(false);
      expect(Typeguards.checkIsObject(123)).toBe(false);
      expect(Typeguards.checkIsObject(true)).toBe(false);
      expect(Typeguards.checkIsObject(undefined)).toBe(false);
    });

    it("Should return true for function objects", () => {
      expect(Typeguards.checkIsObject(() => {})).toBe(false);
      expect(Typeguards.checkIsObject(function () {})).toBe(false);
    });
  });

  describe("checkIsPlainObject", () => {
    it("Should return true for plain objects", () => {
      expect(Typeguards.checkIsPlainObject({})).toBe(true);
      expect(Typeguards.checkIsPlainObject({ a: 1 })).toBe(true);
      expect(Typeguards.checkIsPlainObject({ a: 1, b: { c: 2 } })).toBe(true);
    });

    it("Should return true for Object.create(null)", () => {
      const nullProtoObj = Object.create(null);
      expect(Typeguards.checkIsPlainObject(nullProtoObj)).toBe(true);
    });

    it("Should return false for instances of classes", () => {
      class TestClass {}
      const instance = new TestClass();
      expect(Typeguards.checkIsPlainObject(instance)).toBe(false);
      expect(Typeguards.checkIsPlainObject(new Date())).toBe(false);
      expect(Typeguards.checkIsPlainObject(new Error())).toBe(false);
    });

    it("Should return false for arrays", () => {
      expect(Typeguards.checkIsPlainObject([])).toBe(false);
      expect(Typeguards.checkIsPlainObject([1, 2, 3])).toBe(false);
    });

    it("Should return false for null", () => {
      expect(Typeguards.checkIsPlainObject(null)).toBe(false);
    });

    it("Should return false for primitives", () => {
      expect(Typeguards.checkIsPlainObject("string")).toBe(false);
      expect(Typeguards.checkIsPlainObject(123)).toBe(false);
      expect(Typeguards.checkIsPlainObject(true)).toBe(false);
      expect(Typeguards.checkIsPlainObject(undefined)).toBe(false);
    });

    it("Should return false for functions", () => {
      expect(Typeguards.checkIsPlainObject(() => {})).toBe(false);
      expect(Typeguards.checkIsPlainObject(function () {})).toBe(false);
    });

    it("Should return false for special built-in objects", () => {
      expect(Typeguards.checkIsPlainObject(/regex/)).toBe(false);
      expect(Typeguards.checkIsPlainObject(new Map())).toBe(false);
      expect(Typeguards.checkIsPlainObject(new Set())).toBe(false);
    });
  });

  describe("checkIsPrimitive", () => {
    it("Should return true for strings", () => {
      expect(Typeguards.checkIsPrimitive("")).toBe(true);
      expect(Typeguards.checkIsPrimitive("hello")).toBe(true);
      expect(Typeguards.checkIsPrimitive(String("test"))).toBe(true);
    });

    it("Should return true for numbers", () => {
      expect(Typeguards.checkIsPrimitive(0)).toBe(true);
      expect(Typeguards.checkIsPrimitive(123)).toBe(true);
      expect(Typeguards.checkIsPrimitive(-456)).toBe(true);
      expect(Typeguards.checkIsPrimitive(3.14)).toBe(true);
      expect(Typeguards.checkIsPrimitive(Infinity)).toBe(true);
    });

    it("Should return false for NaN", () => {
      // NaN is not considered a valid number by checkIsNumber
      expect(Typeguards.checkIsPrimitive(NaN)).toBe(false);
    });

    it("Should return true for booleans", () => {
      expect(Typeguards.checkIsPrimitive(true)).toBe(true);
      expect(Typeguards.checkIsPrimitive(false)).toBe(true);
    });

    it("Should return true for symbols", () => {
      expect(Typeguards.checkIsPrimitive(Symbol("test"))).toBe(true);
      expect(Typeguards.checkIsPrimitive(Symbol.for("global"))).toBe(true);
    });

    it("Should return true for bigint", () => {
      expect(Typeguards.checkIsPrimitive(BigInt(123))).toBe(true);
      expect(Typeguards.checkIsPrimitive(123n)).toBe(true);
    });

    it("Should return false for null and undefined", () => {
      expect(Typeguards.checkIsPrimitive(null)).toBe(false);
      expect(Typeguards.checkIsPrimitive(undefined)).toBe(false);
    });

    it("Should return false for objects", () => {
      expect(Typeguards.checkIsPrimitive({})).toBe(false);
      expect(Typeguards.checkIsPrimitive({ a: 1 })).toBe(false);
      expect(Typeguards.checkIsPrimitive([])).toBe(false);
      expect(Typeguards.checkIsPrimitive(new Date())).toBe(false);
    });

    it("Should return false for functions", () => {
      expect(Typeguards.checkIsPrimitive(() => {})).toBe(false);
      expect(Typeguards.checkIsPrimitive(function () {})).toBe(false);
    });
  });

  describe("checkIsString", () => {
    it("Should return true for strings", () => {
      expect(Typeguards.checkIsString("")).toBe(true);
      expect(Typeguards.checkIsString("hello")).toBe(true);
      expect(Typeguards.checkIsString("123")).toBe(true);
      expect(Typeguards.checkIsString(String("test"))).toBe(true);
      expect(Typeguards.checkIsString(`template string`)).toBe(true);
    });

    it("Should return false for non-strings", () => {
      expect(Typeguards.checkIsString(123)).toBe(false);
      expect(Typeguards.checkIsString(true)).toBe(false);
      expect(Typeguards.checkIsString(null)).toBe(false);
      expect(Typeguards.checkIsString(undefined)).toBe(false);
      expect(Typeguards.checkIsString({})).toBe(false);
      expect(Typeguards.checkIsString([])).toBe(false);
    });

    it("Should return false for String objects", () => {
      // String objects are not primitives
      expect(Typeguards.checkIsString(new String("test"))).toBe(false);
    });
  });

  describe("Type narrowing", () => {
    it("Should narrow types correctly in TypeScript", () => {
      const value: unknown = "hello";

      if (Typeguards.checkIsString(value)) {
        // TypeScript should know this is a string
        const length: number = value.length;
        expect(length).toBe(5);
      }
    });

    it("Should narrow array types correctly", () => {
      const value: unknown = [1, 2, 3];

      if (Typeguards.checkIsArray(value)) {
        // TypeScript should know this is an array
        const length: number = value.length;
        expect(length).toBe(3);
      }
    });

    it("Should narrow object types correctly", () => {
      const value: unknown = { key: "value" };

      if (Typeguards.checkIsObject(value)) {
        // TypeScript should know this is an object
        expect(value).toHaveProperty("key");
      }
    });

    it("Should narrow keyof types correctly", () => {
      const obj = { a: 1, b: 2 };
      const key: string = "a";

      if (Typeguards.checkIsKeyof(obj, key)) {
        // TypeScript should know key is keyof typeof obj
        const value: number = obj[key];
        expect(value).toBe(1);
      }
    });
  });
});
