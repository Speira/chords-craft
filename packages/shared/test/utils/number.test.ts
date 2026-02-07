import { describe, expect, it } from "vitest";

import { NumberUtils } from "../../src/utils/number";

describe("NumberUtils test suite", () => {
  describe("formatPrice", () => {
    it("Should format price with default USD currency", () => {
      expect(NumberUtils.formatPrice(100)).toBe("$100.00");
      expect(NumberUtils.formatPrice(1234.56)).toBe("$1,234.56");
      expect(NumberUtils.formatPrice(0.99)).toBe("$0.99");
    });

    it("Should format price with different currencies", () => {
      expect(NumberUtils.formatPrice(100, "EUR", "en-US")).toContain("100.00");
      expect(NumberUtils.formatPrice(100, "GBP", "en-GB")).toContain("100.00");
    });

    it("Should format price with different locales", () => {
      expect(NumberUtils.formatPrice(1234.56, "USD", "en-US")).toBe("$1,234.56");
      // Different locales may format differently
      const frPrice = NumberUtils.formatPrice(1234.56, "EUR", "fr-FR");
      expect(frPrice).toContain("1");
      expect(frPrice).toContain("234");
      expect(frPrice).toContain("56");
    });

    it("Should format negative prices", () => {
      const result = NumberUtils.formatPrice(-100);
      expect(result).toContain("100.00");
    });

    it("Should always show two decimal places", () => {
      expect(NumberUtils.formatPrice(100)).toContain(".00");
      expect(NumberUtils.formatPrice(100.5)).toContain(".50");
      expect(NumberUtils.formatPrice(100.123)).toContain(".12");
    });

    it("Should handle zero", () => {
      expect(NumberUtils.formatPrice(0)).toBe("$0.00");
    });
  });

  describe("toIntPrice", () => {
    it("Should convert float price to integer price", () => {
      expect(NumberUtils.toIntPrice(100.123456)).toBe(10012);
      expect(NumberUtils.toIntPrice(10.50)).toBe(1050);
      expect(NumberUtils.toIntPrice(1.99)).toBe(199);
    });

    it("Should handle whole numbers", () => {
      expect(NumberUtils.toIntPrice(100)).toBe(10000);
      expect(NumberUtils.toIntPrice(1)).toBe(100);
    });

    it("Should round properly", () => {
      expect(NumberUtils.toIntPrice(10.555)).toBe(1056);
      expect(NumberUtils.toIntPrice(10.554)).toBe(1055);
    });

    it("Should handle zero", () => {
      expect(NumberUtils.toIntPrice(0)).toBe(0);
    });

    it("Should handle negative prices", () => {
      expect(NumberUtils.toIntPrice(-10.50)).toBe(-1050);
    });

    it("Should handle very small numbers", () => {
      expect(NumberUtils.toIntPrice(0.01)).toBe(1);
      expect(NumberUtils.toIntPrice(0.001)).toBe(0);
    });
  });

  describe("toFloatPrice", () => {
    it("Should convert integer price to float price", () => {
      expect(NumberUtils.toFloatPrice(10012)).toBe(100.12);
      expect(NumberUtils.toFloatPrice(1050)).toBe(10.5);
      expect(NumberUtils.toFloatPrice(199)).toBe(1.99);
    });

    it("Should handle whole numbers", () => {
      expect(NumberUtils.toFloatPrice(10000)).toBe(100);
      expect(NumberUtils.toFloatPrice(100)).toBe(1);
    });

    it("Should handle zero", () => {
      expect(NumberUtils.toFloatPrice(0)).toBe(0);
    });

    it("Should handle negative prices", () => {
      expect(NumberUtils.toFloatPrice(-1050)).toBe(-10.5);
    });

    it("Should be inverse of toIntPrice", () => {
      const original = 123.45;
      const intPrice = NumberUtils.toIntPrice(original);
      const floatPrice = NumberUtils.toFloatPrice(intPrice);
      expect(floatPrice).toBeCloseTo(original, 2);
    });
  });

  describe("formatSafePrice", () => {
    it("Should format safe price using formatPrice", () => {
      expect(NumberUtils.formatSafePrice(100)).toBe("$100.00");
      expect(NumberUtils.formatSafePrice(1234.56)).toBe("$1,234.56");
    });
  });

  describe("formatNumber", () => {
    it("Should format numbers with default locale", () => {
      expect(NumberUtils.formatNumber(100)).toBe("100");
      expect(NumberUtils.formatNumber(1234)).toBe("1,234");
      expect(NumberUtils.formatNumber(1234567)).toBe("1,234,567");
    });

    it("Should format numbers with different locales", () => {
      expect(NumberUtils.formatNumber(1234, "en-US")).toBe("1,234");
      // French locale uses different separators
      const frNumber = NumberUtils.formatNumber(1234, "fr-FR");
      expect(frNumber).toContain("1");
      expect(frNumber).toContain("234");
    });

    it("Should handle decimal numbers", () => {
      const result = NumberUtils.formatNumber(1234.56);
      expect(result).toContain("1");
      expect(result).toContain("234");
    });

    it("Should handle zero", () => {
      expect(NumberUtils.formatNumber(0)).toBe("0");
    });

    it("Should handle negative numbers", () => {
      const result = NumberUtils.formatNumber(-1234);
      expect(result).toContain("1");
      expect(result).toContain("234");
    });
  });

  describe("formatPercent", () => {
    it("Should format percentage with default locale", () => {
      expect(NumberUtils.formatPercent(50)).toBe("50%");
      expect(NumberUtils.formatPercent(100)).toBe("100%");
      expect(NumberUtils.formatPercent(0)).toBe("0%");
    });

    it("Should handle decimal percentages", () => {
      expect(NumberUtils.formatPercent(50.5)).toBe("50.5%");
      expect(NumberUtils.formatPercent(33.33)).toBe("33.33%");
    });

    it("Should handle percentages over 100", () => {
      expect(NumberUtils.formatPercent(150)).toBe("150%");
    });

    it("Should handle negative percentages", () => {
      const result = NumberUtils.formatPercent(-25);
      expect(result).toContain("25");
    });

    it("Should round to maximum 2 decimal places", () => {
      const result = NumberUtils.formatPercent(33.33333);
      expect(result).toMatch(/33\.33%?/);
    });
  });

  describe("round", () => {
    it("Should round to 2 decimal places by default", () => {
      expect(NumberUtils.round(100.123456)).toBe(100.12);
      expect(NumberUtils.round(100.126)).toBe(100.13);
      expect(NumberUtils.round(100.125)).toBe(100.13);
    });

    it("Should round to custom decimal places", () => {
      expect(NumberUtils.round(100.123456, 0)).toBe(100);
      expect(NumberUtils.round(100.123456, 1)).toBe(100.1);
      expect(NumberUtils.round(100.123456, 3)).toBe(100.123);
      expect(NumberUtils.round(100.123456, 4)).toBe(100.1235);
    });

    it("Should handle whole numbers", () => {
      expect(NumberUtils.round(100)).toBe(100);
      expect(NumberUtils.round(100, 0)).toBe(100);
    });

    it("Should handle negative numbers", () => {
      expect(NumberUtils.round(-100.126, 2)).toBe(-100.13);
      expect(NumberUtils.round(-100.123, 2)).toBe(-100.12);
    });

    it("Should handle zero", () => {
      expect(NumberUtils.round(0)).toBe(0);
    });
  });

  describe("clamp", () => {
    it("Should return value if within range", () => {
      expect(NumberUtils.clamp(10, 0, 100)).toBe(10);
      expect(NumberUtils.clamp(50, 0, 100)).toBe(50);
      expect(NumberUtils.clamp(0, 0, 100)).toBe(0);
      expect(NumberUtils.clamp(100, 0, 100)).toBe(100);
    });

    it("Should return min if value is below min", () => {
      expect(NumberUtils.clamp(-10, 0, 100)).toBe(0);
      expect(NumberUtils.clamp(-100, 0, 100)).toBe(0);
    });

    it("Should return max if value is above max", () => {
      expect(NumberUtils.clamp(110, 0, 100)).toBe(100);
      expect(NumberUtils.clamp(200, 0, 100)).toBe(100);
    });

    it("Should handle negative ranges", () => {
      expect(NumberUtils.clamp(-5, -10, 10)).toBe(-5);
      expect(NumberUtils.clamp(-15, -10, 10)).toBe(-10);
      expect(NumberUtils.clamp(15, -10, 10)).toBe(10);
    });

    it("Should handle decimal numbers", () => {
      expect(NumberUtils.clamp(5.5, 0, 10)).toBe(5.5);
      expect(NumberUtils.clamp(-0.5, 0, 10)).toBe(0);
      expect(NumberUtils.clamp(10.5, 0, 10)).toBe(10);
    });
  });

  describe("random", () => {
    it("Should generate random number within range", () => {
      for (let i = 0; i < 100; i++) {
        const result = NumberUtils.random(0, 100);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }
    });

    it("Should generate different numbers", () => {
      const results = new Set();
      for (let i = 0; i < 10; i++) {
        results.add(NumberUtils.random(0, 1000));
      }
      // Should have generated multiple different numbers
      expect(results.size).toBeGreaterThan(1);
    });

    it("Should work with negative ranges", () => {
      for (let i = 0; i < 100; i++) {
        const result = NumberUtils.random(-50, 50);
        expect(result).toBeGreaterThanOrEqual(-50);
        expect(result).toBeLessThanOrEqual(50);
      }
    });

    it("Should work with decimal ranges", () => {
      const result = NumberUtils.random(0.5, 1.5);
      expect(result).toBeGreaterThanOrEqual(0.5);
      expect(result).toBeLessThanOrEqual(1.5);
    });
  });

  describe("randomInt", () => {
    it("Should generate random integer within range", () => {
      for (let i = 0; i < 100; i++) {
        const result = NumberUtils.randomInt(0, 100);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it("Should generate different integers", () => {
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        results.add(NumberUtils.randomInt(0, 1000));
      }
      // Should have generated multiple different numbers
      expect(results.size).toBeGreaterThan(1);
    });

    it("Should work with negative ranges", () => {
      for (let i = 0; i < 100; i++) {
        const result = NumberUtils.randomInt(-50, 50);
        expect(result).toBeGreaterThanOrEqual(-50);
        expect(result).toBeLessThanOrEqual(50);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it("Should include both min and max", () => {
      const results = new Set();
      // Run many times to increase chance of hitting boundaries
      for (let i = 0; i < 1000; i++) {
        results.add(NumberUtils.randomInt(0, 1));
      }
      expect(results.has(0)).toBe(true);
      expect(results.has(1)).toBe(true);
    });
  });

  describe("checkIsEven", () => {
    it("Should return true for even numbers", () => {
      expect(NumberUtils.checkIsEven(0)).toBe(true);
      expect(NumberUtils.checkIsEven(2)).toBe(true);
      expect(NumberUtils.checkIsEven(4)).toBe(true);
      expect(NumberUtils.checkIsEven(100)).toBe(true);
      expect(NumberUtils.checkIsEven(-2)).toBe(true);
      expect(NumberUtils.checkIsEven(-100)).toBe(true);
    });

    it("Should return false for odd numbers", () => {
      expect(NumberUtils.checkIsEven(1)).toBe(false);
      expect(NumberUtils.checkIsEven(3)).toBe(false);
      expect(NumberUtils.checkIsEven(99)).toBe(false);
      expect(NumberUtils.checkIsEven(-1)).toBe(false);
      expect(NumberUtils.checkIsEven(-99)).toBe(false);
    });
  });

  describe("checkIsOdd", () => {
    it("Should return true for odd numbers", () => {
      expect(NumberUtils.checkIsOdd(1)).toBe(true);
      expect(NumberUtils.checkIsOdd(3)).toBe(true);
      expect(NumberUtils.checkIsOdd(99)).toBe(true);
      expect(NumberUtils.checkIsOdd(-1)).toBe(true);
      expect(NumberUtils.checkIsOdd(-99)).toBe(true);
    });

    it("Should return false for even numbers", () => {
      expect(NumberUtils.checkIsOdd(0)).toBe(false);
      expect(NumberUtils.checkIsOdd(2)).toBe(false);
      expect(NumberUtils.checkIsOdd(100)).toBe(false);
      expect(NumberUtils.checkIsOdd(-2)).toBe(false);
      expect(NumberUtils.checkIsOdd(-100)).toBe(false);
    });
  });

  describe("factorial", () => {
    it("Should calculate factorial of positive numbers", () => {
      expect(NumberUtils.factorial(0)).toBe(1);
      expect(NumberUtils.factorial(1)).toBe(1);
      expect(NumberUtils.factorial(2)).toBe(2);
      expect(NumberUtils.factorial(3)).toBe(6);
      expect(NumberUtils.factorial(4)).toBe(24);
      expect(NumberUtils.factorial(5)).toBe(120);
      expect(NumberUtils.factorial(6)).toBe(720);
    });

    it("Should return NaN for negative numbers", () => {
      expect(NumberUtils.factorial(-1)).toBeNaN();
      expect(NumberUtils.factorial(-5)).toBeNaN();
    });

    it("Should handle larger numbers", () => {
      expect(NumberUtils.factorial(10)).toBe(3628800);
    });
  });

  describe("fibonacci", () => {
    it("Should calculate fibonacci numbers", () => {
      expect(NumberUtils.fibonacci(0)).toBe(0);
      expect(NumberUtils.fibonacci(1)).toBe(1);
      expect(NumberUtils.fibonacci(2)).toBe(1);
      expect(NumberUtils.fibonacci(3)).toBe(2);
      expect(NumberUtils.fibonacci(4)).toBe(3);
      expect(NumberUtils.fibonacci(5)).toBe(5);
      expect(NumberUtils.fibonacci(6)).toBe(8);
      expect(NumberUtils.fibonacci(7)).toBe(13);
      expect(NumberUtils.fibonacci(8)).toBe(21);
    });

    it("Should return NaN for negative numbers", () => {
      expect(NumberUtils.fibonacci(-1)).toBeNaN();
      expect(NumberUtils.fibonacci(-5)).toBeNaN();
    });

    it("Should handle larger fibonacci numbers", () => {
      expect(NumberUtils.fibonacci(10)).toBe(55);
      expect(NumberUtils.fibonacci(15)).toBe(610);
    });
  });
});

