import { describe, expect, it } from "vitest";

import { ObjectUtils } from "../../src/utils/object";

describe("ObjectUtils test suite", () => {
  describe("keysToString", () => {
    it("Should convert object keys to string", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = ObjectUtils.keysToString(obj);
      expect(result).toBe("a b c");
    });

    it("Should only include truthy values", () => {
      const obj = { header: true, blue: 3, warning: false, alert: 0 };
      const result = ObjectUtils.keysToString(obj);
      expect(result).toBe("header blue");
    });

    it("Should add prefix to keys", () => {
      const obj = { header: true, blue: 3, warning: false };
      const result = ObjectUtils.keysToString(obj, { prefix: "pre_" });
      expect(result).toBe("pre_header pre_blue");
    });

    it("Should add suffix to keys", () => {
      const obj = { header: true, blue: 3, warning: false };
      const result = ObjectUtils.keysToString(obj, { suffix: "_suf" });
      expect(result).toBe("header_suf blue_suf");
    });

    it("Should add both prefix and suffix to keys", () => {
      const obj = { header: true, blue: 3, warning: false };
      const result = ObjectUtils.keysToString(obj, {
        prefix: "pre_",
        suffix: "_suf",
      });
      expect(result).toBe("pre_header_suf pre_blue_suf");
    });

    it("Should handle empty objects", () => {
      const obj = {};
      const result = ObjectUtils.keysToString(obj);
      expect(result).toBe("");
    });

    it("Should handle objects with all falsy values", () => {
      const obj = { a: false, b: 0, c: null };
      const result = ObjectUtils.keysToString(obj);
      expect(result).toBe("");
    });
  });

  describe("displayValue", () => {
    it("Should display string values", () => {
      const item = { name: "Alice", age: 30 };
      const result = ObjectUtils.displayValue(item, "name");
      expect(result).toBe("Alice");
    });

    it("Should display number values", () => {
      const item = { name: "Alice", age: 30 };
      const result = ObjectUtils.displayValue(item, "age");
      expect(result).toBe(30);
    });

    it("Should display boolean true as 'yes'", () => {
      const item = { active: true, admin: false };
      const result = ObjectUtils.displayValue(item, "active");
      expect(result).toBe("yes");
    });

    it("Should display boolean false as 'no'", () => {
      const item = { active: true, admin: false };
      const result = ObjectUtils.displayValue(item, "admin");
      expect(result).toBe("no");
    });

    it("Should use custom boolean values", () => {
      const item = { active: true, admin: false };
      const result1 = ObjectUtils.displayValue(item, "active", ["✓", "✗"]);
      const result2 = ObjectUtils.displayValue(item, "admin", ["✓", "✗"]);
      expect(result1).toBe("✓");
      expect(result2).toBe("✗");
    });

    it("Should return empty string for non-existent keys", () => {
      const item = { name: "Alice" };
      const result = ObjectUtils.displayValue(item, "nonExistent");
      expect(result).toBe("");
    });

    it("Should display nested object values in flattened format", () => {
      const item = { nested: { value: 1, other: 2, subNested: { value: 3, other: 4 } } };
      const result = ObjectUtils.displayValue(item, "nested");
      expect(result).toBe("value:1; other:2; subNested.value:3; subNested.other:4");
    });

    it("Should display simple nested objects", () => {
      const item = { config: { host: "localhost", port: 3000 } };
      const result = ObjectUtils.displayValue(item, "config");
      expect(result).toBe("host:localhost; port:3000");
    });

    it("Should handle deeply nested objects", () => {
      const item = { data: { level1: { level2: { level3: "deep" } } } };
      const result = ObjectUtils.displayValue(item, "data");
      expect(result).toBe("level1.level2.level3:deep");
    });

    it("Should handle mixed nested objects with primitives", () => {
      const item = {
        user: { name: "Alice", age: 30, address: { city: "NYC", zip: 10001 } },
      };
      const result = ObjectUtils.displayValue(item, "user");
      expect(result).toBe("name:Alice; age:30; address.city:NYC; address.zip:10001");
    });

    it("Should display array values in formatted representation", () => {
      const item = {
        list: [
          1,
          2,
          3,
          { value: 4, other: [1, 2], another: { value: 5, otherValue: 6 } },
        ],
      };
      const result = ObjectUtils.displayValue(item, "list");
      expect(result).toBe(
        "[1, 2, 3, {value:4; other:[1, 2]; another.value:5; another.otherValue:6}]",
      );
    });
  });

  describe("flattenObject", () => {
    it("Should flatten simple object", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe("a:1; b:2; c:3");
    });

    it("Should flatten nested object with dot notation", () => {
      const obj = { a: 1, b: { c: 2 } };
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe("a:1; b.c:2");
    });

    it("Should flatten deeply nested objects", () => {
      const obj = { level1: { level2: { level3: { value: "deep" } } } };
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe("level1.level2.level3.value:deep");
    });

    it("Should handle mixed types in object", () => {
      const obj = { str: "hello", num: 42, bool: true, nul: null };
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe("str:hello; num:42; bool:true; nul:null");
    });

    it("Should handle arrays in object", () => {
      const obj = { a: 1, b: [1, 2, 3] };
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe("a:1; b:[1, 2, 3]");
    });

    it("Should handle nested arrays in object", () => {
      const obj = { a: 1, b: [1, [2, 3], 4] };
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe("a:1; b:[1, [2, 3], 4]");
    });

    it("Should handle objects within arrays", () => {
      const obj = {
        items: [
          { id: 1, name: "first" },
          { id: 2, name: "second" },
        ],
      };
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe("items:[{id:1; name:first}, {id:2; name:second}]");
    });

    it("Should handle complex nested structure", () => {
      const obj = {
        user: {
          name: "Alice",
          settings: { theme: "dark", notifications: true },
          tags: ["admin", "user"],
        },
      };
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe(
        "user.name:Alice; user.settings.theme:dark; user.settings.notifications:true; user.tags:[admin, user]",
      );
    });

    it("Should use custom prefix", () => {
      const obj = { a: 1, b: { c: 2 } };
      const result = ObjectUtils.flattenObject(obj, "root");
      expect(result).toBe("root.a:1; root.b.c:2");
    });

    it("Should handle empty object", () => {
      const obj = {};
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe("");
    });

    it("Should handle object with undefined values", () => {
      const obj = { a: 1, b: undefined, c: 3 };
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe("a:1; b:undefined; c:3");
    });

    it("Should handle deeply nested objects with arrays", () => {
      const obj = {
        data: {
          items: [
            { id: 1, values: [10, 20] },
            { id: 2, values: [30, 40] },
          ],
        },
      };
      const result = ObjectUtils.flattenObject(obj);
      expect(result).toBe(
        "data.items:[{id:1; values:[10, 20]}, {id:2; values:[30, 40]}]",
      );
    });
  });

  describe("pick", () => {
    it("Should pick specified keys from object", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = ObjectUtils.pick(obj, ["a", "c"]);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it("Should pick single key from object", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = ObjectUtils.pick(obj, ["b"]);
      expect(result).toEqual({ b: 2 });
    });

    it("Should handle empty keys array", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = ObjectUtils.pick(obj, []);
      expect(result).toEqual({});
    });

    it("Should handle picking all keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = ObjectUtils.pick(obj, ["a", "b", "c"]);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("Should preserve value types", () => {
      const obj = {
        str: "hello",
        num: 42,
        bool: true,
        nul: null,
        und: undefined,
      };
      const result = ObjectUtils.pick(obj, ["str", "num", "bool", "nul"]);
      expect(result).toEqual({
        str: "hello",
        num: 42,
        bool: true,
        nul: null,
      });
    });

    it("Should maintain type safety with Pick<T, K>", () => {
      const obj = { a: 1, b: "two", c: true };
      const result = ObjectUtils.pick(obj, ["a", "c"]);

      // TypeScript should infer the type as Pick<typeof obj, "a" | "c">
      // which means result.a is number and result.c is boolean
      expect(typeof result.a).toBe("number");
      expect(typeof result.c).toBe("boolean");
      // @ts-expect-error - b should not exist in the result type
      expect(result.b).toBeUndefined();
    });
  });

  describe("mergeDeepPartial", () => {
    it("Should merge flat objects", () => {
      const target = { a: 1, b: 2 };
      const modifier = { a: 3, c: 4 };
      const result = ObjectUtils.mergeDeepPartial(target, modifier);
      expect(result).toEqual({ a: 3, b: 2, c: 4 });
    });

    it("Should merge nested objects", () => {
      const target = { foo: { bar: 1, baz: 2 }, arr: [1, 2] };
      const modifier = { foo: { bar: 3 }, arr: [3] };
      const result = ObjectUtils.mergeDeepPartial(target, modifier);
      expect(result).toEqual({ foo: { bar: 3, baz: 2 }, arr: [3] });
    });

    it("Should merge multiple modifiers", () => {
      const target = { a: 1, b: 2 };
      const modifier1 = { a: 3, c: 4 };
      const modifier2 = { a: 5, d: 6 };
      const result = ObjectUtils.mergeDeepPartial(target, modifier1, modifier2);
      expect(result).toEqual({ a: 5, b: 2, c: 4, d: 6 });
    });

    it("Should handle deeply nested objects", () => {
      const target = {
        level1: {
          level2: {
            level3: { value: 1, keep: true },
          },
        },
      };
      const modifier = {
        level1: {
          level2: {
            level3: { value: 2 },
          },
        },
      };
      const result = ObjectUtils.mergeDeepPartial(target, modifier);
      expect(result).toEqual({
        level1: {
          level2: {
            level3: { value: 2, keep: true },
          },
        },
      });
    });

    it("Should return target when no modifiers provided", () => {
      const target = { a: 1, b: 2 };
      const result = ObjectUtils.mergeDeepPartial(target);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("Should not mutate the original target", () => {
      const target = { a: 1, b: 2 };
      const modifier = { a: 3, c: 4 };
      const result = ObjectUtils.mergeDeepPartial(target, modifier);
      expect(target).toEqual({ a: 1, b: 2 }); // Original should be unchanged
      expect(result).toEqual({ a: 3, b: 2, c: 4 });
    });

    it("Should skip undefined values", () => {
      const target = { a: 1, b: 2 };
      const modifier = { a: undefined, c: 4 };
      const result = ObjectUtils.mergeDeepPartial(target, modifier);
      expect(result).toEqual({ a: 1, b: 2, c: 4 });
    });

    it("Should merge null values", () => {
      const target = { a: 1, b: 2 };
      const modifier = { a: null, c: 4 };
      const result = ObjectUtils.mergeDeepPartial(target, modifier);
      expect(result).toEqual({ a: null, b: 2, c: 4 });
    });

    it("Should replace nested object with primitive value", () => {
      const target = { a: { nested: 1 }, b: 2 };
      const modifier = { a: 42 };
      const result = ObjectUtils.mergeDeepPartial(target, modifier);
      expect(result).toEqual({ a: 42, b: 2 });
    });

    it("Should replace primitive with nested object", () => {
      const target = { a: 1, b: 2 };
      const modifier = { a: { nested: 42 } };
      const result = ObjectUtils.mergeDeepPartial(target, modifier);
      expect(result).toEqual({ a: { nested: 42 }, b: 2 });
    });
  });
});
