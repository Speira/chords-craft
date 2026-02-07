import { describe, expect, it } from "vitest";

import { StringUtils } from "../../src/utils/string";

describe("StringUtils test suite", () => {
  describe("capitalize", () => {
    it("Should capitalize the first letter and lowercase the rest", () => {
      expect(StringUtils.capitalize("hello")).toBe("Hello");
      expect(StringUtils.capitalize("HELLO")).toBe("Hello");
      expect(StringUtils.capitalize("hELLO")).toBe("Hello");
    });

    it("Should handle single character strings", () => {
      expect(StringUtils.capitalize("a")).toBe("A");
      expect(StringUtils.capitalize("Z")).toBe("Z");
    });

    it("Should handle empty strings", () => {
      expect(StringUtils.capitalize("")).toBe("");
    });

    it("Should handle strings with numbers", () => {
      expect(StringUtils.capitalize("hello123")).toBe("Hello123");
    });
  });

  describe("checkEmail", () => {
    it("Should validate correct email addresses", () => {
      expect(StringUtils.checkEmail("test@example.com")).toBe(true);
      expect(StringUtils.checkEmail("user.name@example.com")).toBe(true);
      expect(StringUtils.checkEmail("user+tag@example.co.uk")).toBe(true);
      expect(StringUtils.checkEmail("test123@test-domain.com")).toBe(true);
    });

    it("Should reject invalid email addresses", () => {
      expect(StringUtils.checkEmail("test@example")).toBe(false);
      expect(StringUtils.checkEmail("test@")).toBe(false);
      expect(StringUtils.checkEmail("@example.com")).toBe(false);
      expect(StringUtils.checkEmail("test.example.com")).toBe(false);
      expect(StringUtils.checkEmail("test @example.com")).toBe(false);
      expect(StringUtils.checkEmail("")).toBe(false);
    });
  });

  describe("checkPassword", () => {
    it("Should validate passwords meeting all requirements", () => {
      expect(StringUtils.checkPassword("Password123!")).toBe(true);
      expect(StringUtils.checkPassword("MyP@ssw0rd")).toBe(true);
      expect(StringUtils.checkPassword("Abcd123!")).toBe(true);
    });

    it("Should reject passwords missing uppercase", () => {
      expect(StringUtils.checkPassword("password123!")).toBe(false);
    });

    it("Should reject passwords missing lowercase", () => {
      expect(StringUtils.checkPassword("PASSWORD123!")).toBe(false);
    });

    it("Should reject passwords missing digits", () => {
      expect(StringUtils.checkPassword("Password!")).toBe(false);
    });

    it("Should reject passwords missing special characters", () => {
      expect(StringUtils.checkPassword("Password123")).toBe(false);
    });

    it("Should reject passwords that are too short", () => {
      expect(StringUtils.checkPassword("Pass1!")).toBe(false);
    });

    it("Should validate with custom length requirements", () => {
      expect(StringUtils.checkPassword("Pass1!", 6, 20)).toBe(true);
      expect(StringUtils.checkPassword("Password123!", 10, 20)).toBe(true);
      expect(StringUtils.checkPassword("Pass1!", 10, 20)).toBe(false);
    });

    it("Should reject passwords that are too long", () => {
      const longPassword = "Password123!" + "a".repeat(60);
      expect(StringUtils.checkPassword(longPassword, 8, 64)).toBe(false);
    });
  });

  describe("stripTags", () => {
    it("Should remove HTML tags from strings", () => {
      expect(StringUtils.stripTags("<div>Hello</div>")).toBe("Hello");
      expect(StringUtils.stripTags("<p>Test</p>")).toBe("Test");
      expect(StringUtils.stripTags("<a href='#'>Link</a>")).toBe("Link");
    });

    it("Should handle multiple tags", () => {
      expect(StringUtils.stripTags("<div><p>Hello</p></div>")).toBe("Hello");
      expect(StringUtils.stripTags("<strong><em>Bold and italic</em></strong>")).toBe(
        "Bold and italic",
      );
    });

    it("Should handle self-closing tags", () => {
      expect(StringUtils.stripTags("Line 1<br/>Line 2")).toBe("Line 1Line 2");
      expect(StringUtils.stripTags("Image<img src='test.jpg'/>here")).toBe("Imagehere");
    });

    it("Should handle strings without tags", () => {
      expect(StringUtils.stripTags("Plain text")).toBe("Plain text");
    });

    it("Should handle empty strings", () => {
      expect(StringUtils.stripTags("")).toBe("");
    });
  });

  describe("toTitleCase", () => {
    it("Should convert to title case", () => {
      expect(StringUtils.toTitleCase("hello world")).toBe("Hello World");
      expect(StringUtils.toTitleCase("THE QUICK BROWN FOX")).toBe("The Quick Brown Fox");
      expect(StringUtils.toTitleCase("tHe QuIcK bRoWn FoX")).toBe("The Quick Brown Fox");
    });

    it("Should handle single words", () => {
      expect(StringUtils.toTitleCase("hello")).toBe("Hello");
    });

    it("Should handle empty strings", () => {
      expect(StringUtils.toTitleCase("")).toBe("");
    });
  });

  describe("toCamelCase", () => {
    it("Should convert to camelCase", () => {
      expect(StringUtils.toCamelCase("Hello World")).toBe("helloWorld");
      expect(StringUtils.toCamelCase("hello world")).toBe("helloWorld");
    });

    it("Should handle all uppercase strings", () => {
      // All uppercase strings are handled differently by the regex
      expect(StringUtils.toCamelCase("HELLO WORLD")).toBe("hELLOWORLD");
    });

    it("Should handle strings with multiple spaces", () => {
      expect(StringUtils.toCamelCase("hello  world  test")).toBe("helloWorldTest");
    });

    it("Should handle single words", () => {
      expect(StringUtils.toCamelCase("Hello")).toBe("hello");
      expect(StringUtils.toCamelCase("hello")).toBe("hello");
    });
  });

  describe("toKebabCase", () => {
    it("Should convert to kebab-case", () => {
      expect(StringUtils.toKebabCase("Hello World")).toBe("hello-world");
      expect(StringUtils.toKebabCase("helloWorld")).toBe("hello-world");
      expect(StringUtils.toKebabCase("HelloWorld")).toBe("hello-world");
    });

    it("Should handle underscores", () => {
      expect(StringUtils.toKebabCase("hello_world")).toBe("hello-world");
    });

    it("Should handle multiple spaces", () => {
      expect(StringUtils.toKebabCase("hello  world")).toBe("hello-world");
    });

    it("Should handle already kebab-case strings", () => {
      expect(StringUtils.toKebabCase("hello-world")).toBe("hello-world");
    });
  });

  describe("toSnakeCase", () => {
    it("Should convert to snake_case", () => {
      expect(StringUtils.toSnakeCase("Hello World")).toBe("hello_world");
      expect(StringUtils.toSnakeCase("helloWorld")).toBe("hello_world");
      expect(StringUtils.toSnakeCase("HelloWorld")).toBe("hello_world");
    });

    it("Should handle hyphens", () => {
      expect(StringUtils.toSnakeCase("hello-world")).toBe("hello_world");
    });

    it("Should handle multiple spaces", () => {
      expect(StringUtils.toSnakeCase("hello  world")).toBe("hello_world");
    });

    it("Should handle already snake_case strings", () => {
      expect(StringUtils.toSnakeCase("hello_world")).toBe("hello_world");
    });
  });

  describe("truncate", () => {
    it("Should truncate strings longer than specified length", () => {
      expect(StringUtils.truncate("Hello World", 8)).toBe("Hello...");
      expect(StringUtils.truncate("Hello World", 5)).toBe("He...");
    });

    it("Should not truncate strings shorter than or equal to specified length", () => {
      expect(StringUtils.truncate("Hello", 5)).toBe("Hello");
      expect(StringUtils.truncate("Hello", 10)).toBe("Hello");
    });

    it("Should use custom suffix", () => {
      expect(StringUtils.truncate("Hello World", 8, "…")).toBe("Hello W…");
      expect(StringUtils.truncate("Hello World", 8, "")).toBe("Hello Wo");
    });

    it("Should handle empty strings", () => {
      expect(StringUtils.truncate("", 5)).toBe("");
    });
  });

  describe("truncateWords", () => {
    it("Should truncate to specified number of words", () => {
      expect(StringUtils.truncateWords("Hello World Test", 2)).toBe("Hello World...");
      expect(StringUtils.truncateWords("One Two Three Four", 3)).toBe("One Two Three...");
    });

    it("Should use custom suffix", () => {
      expect(StringUtils.truncateWords("Hello World Test", 2, "…")).toBe("Hello World…");
      expect(StringUtils.truncateWords("Hello World Test", 2, "")).toBe("Hello World");
    });

    it("Should handle single word", () => {
      expect(StringUtils.truncateWords("Hello", 1)).toBe("Hello...");
    });
  });

  describe("truncateBetween", () => {
    it("Should truncate middle of long strings", () => {
      expect(StringUtils.truncateBetween("Hello World", 3)).toBe("Hel...rld");
      expect(StringUtils.truncateBetween("1234567890", 2)).toBe("12...90");
    });

    it("Should not truncate short strings", () => {
      expect(StringUtils.truncateBetween("Hello", 3)).toBe("Hello");
      expect(StringUtils.truncateBetween("Hello", 5)).toBe("Hello");
    });

    it("Should use custom suffix", () => {
      expect(StringUtils.truncateBetween("Hello World", 3, "…")).toBe("Hel…rld");
    });
  });

  describe("slugify", () => {
    it("Should convert strings to URL-friendly slugs", () => {
      expect(StringUtils.slugify("Hello World")).toBe("hello-world");
      expect(StringUtils.slugify("Hello World!")).toBe("hello-world");
      expect(StringUtils.slugify("Test & Example")).toBe("test-example");
    });

    it("Should remove special characters", () => {
      expect(StringUtils.slugify("Hello@World#123")).toBe("helloworld123");
    });

    it("Should handle multiple spaces and hyphens", () => {
      expect(StringUtils.slugify("hello   world")).toBe("hello-world");
      expect(StringUtils.slugify("hello---world")).toBe("hello-world");
    });

    it("Should trim leading and trailing hyphens", () => {
      expect(StringUtils.slugify("-hello-world-")).toBe("hello-world");
    });

    it("Should handle underscores", () => {
      expect(StringUtils.slugify("hello_world")).toBe("hello-world");
    });
  });

  describe("removeHtml", () => {
    it("Should remove HTML tags", () => {
      expect(StringUtils.removeHtml("<div>Hello</div>")).toBe("Hello");
      expect(StringUtils.removeHtml("<p>Test <strong>bold</strong></p>")).toBe(
        "Test bold",
      );
    });

    it("Should handle self-closing tags", () => {
      expect(StringUtils.removeHtml("Line<br/>Break")).toBe("LineBreak");
    });

    it("Should handle strings without HTML", () => {
      expect(StringUtils.removeHtml("Plain text")).toBe("Plain text");
    });
  });

  describe("escapeHtml", () => {
    it("Should escape HTML special characters", () => {
      expect(StringUtils.escapeHtml("<div>Hello</div>")).toBe(
        "&lt;div&gt;Hello&lt;/div&gt;",
      );
      expect(StringUtils.escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
      expect(StringUtils.escapeHtml('Say "Hello"')).toBe("Say &quot;Hello&quot;");
    });

    it("Should escape apostrophes", () => {
      expect(StringUtils.escapeHtml("It's working")).toBe("It&#39;s working");
    });

    it("Should escape multiple special characters", () => {
      expect(StringUtils.escapeHtml('<div class="test">A & B</div>')).toBe(
        "&lt;div class=&quot;test&quot;&gt;A &amp; B&lt;/div&gt;",
      );
    });

    it("Should handle strings without special characters", () => {
      expect(StringUtils.escapeHtml("Plain text")).toBe("Plain text");
    });
  });

  describe("unescapeHtml", () => {
    it("Should unescape HTML entities", () => {
      expect(StringUtils.unescapeHtml("&lt;div&gt;Hello&lt;/div&gt;")).toBe(
        "<div>Hello</div>",
      );
      expect(StringUtils.unescapeHtml("Tom &amp; Jerry")).toBe("Tom & Jerry");
      expect(StringUtils.unescapeHtml("Say &quot;Hello&quot;")).toBe('Say "Hello"');
    });

    it("Should unescape apostrophes", () => {
      expect(StringUtils.unescapeHtml("It&#39;s working")).toBe("It's working");
    });

    it("Should unescape multiple entities", () => {
      expect(
        StringUtils.unescapeHtml(
          "&lt;div class=&quot;test&quot;&gt;A &amp; B&lt;/div&gt;",
        ),
      ).toBe('<div class="test">A & B</div>');
    });

    it("Should handle strings without entities", () => {
      expect(StringUtils.unescapeHtml("Plain text")).toBe("Plain text");
    });
  });

  describe("formatSentence", () => {
    it("Should capitalize first letter of sentence", () => {
      expect(StringUtils.formatSentence("hello world")).toBe("Hello world");
    });

    it("Should capitalize first letter after punctuation", () => {
      expect(StringUtils.formatSentence("hello world. how are you?")).toBe(
        "Hello world. How are you?",
      );
      expect(StringUtils.formatSentence("great! awesome. nice?")).toBe(
        "Great! Awesome. Nice?",
      );
    });

    it("Should handle multiple spaces after punctuation", () => {
      expect(StringUtils.formatSentence("hello.  world")).toBe("Hello.  World");
    });

    it("Should lowercase everything except sentence starts", () => {
      expect(StringUtils.formatSentence("HELLO WORLD. HOW ARE YOU")).toBe(
        "Hello world. How are you",
      );
    });
  });

  describe("generateId", () => {
    it("Should generate ID of default length 8", () => {
      const id = StringUtils.generateId();
      expect(id).toHaveLength(8);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });

    it("Should generate ID of custom length", () => {
      const id16 = StringUtils.generateId(16);
      expect(id16).toHaveLength(16);
      expect(id16).toMatch(/^[A-Za-z0-9]+$/);

      const id4 = StringUtils.generateId(4);
      expect(id4).toHaveLength(4);
      expect(id4).toMatch(/^[A-Za-z0-9]+$/);
    });

    it("Should generate unique IDs", () => {
      const id1 = StringUtils.generateId();
      const id2 = StringUtils.generateId();
      // While theoretically they could be the same, it's extremely unlikely
      expect(id1).not.toBe(id2);
    });

    it("Should only use alphanumeric characters", () => {
      const id = StringUtils.generateId(100);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe("mask", () => {
    it("Should mask string with default settings", () => {
      expect(StringUtils.mask("1234567890")).toBe("******7890");
      expect(StringUtils.mask("abcdefghij")).toBe("******ghij");
    });

    it("Should use custom visible characters count", () => {
      expect(StringUtils.mask("1234567890", 2)).toBe("********90");
      expect(StringUtils.mask("1234567890", 6)).toBe("****567890");
    });

    it("Should use custom mask character", () => {
      expect(StringUtils.mask("1234567890", 4, "#")).toBe("######7890");
      expect(StringUtils.mask("1234567890", 4, "X")).toBe("XXXXXX7890");
    });

    it("Should not mask strings shorter than or equal to visible chars", () => {
      expect(StringUtils.mask("1234", 4)).toBe("1234");
      expect(StringUtils.mask("123", 4)).toBe("123");
    });

    it("Should handle edge cases", () => {
      expect(StringUtils.mask("12345", 10)).toBe("12345");
      expect(StringUtils.mask("", 4)).toBe("");
    });
  });

  describe("static properties", () => {
    it("Should have chars property with alphanumeric characters", () => {
      expect(StringUtils.chars).toBeDefined();
      expect(StringUtils.chars).toContain("A");
      expect(StringUtils.chars).toContain("z");
      expect(StringUtils.chars).toContain("0");
      expect(StringUtils.chars).toContain("9");
    });

    it("Should have specialChars property", () => {
      expect(StringUtils.specialChars).toBeDefined();
      expect(StringUtils.specialChars).toContain("!");
      expect(StringUtils.specialChars).toContain("@");
      expect(StringUtils.specialChars).toContain("#");
    });
  });
});
