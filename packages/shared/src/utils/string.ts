/**
 * Utility class for common string operations.
 *
 * Methods include:
 *
 * - Capitalize: Capitalizes the first letter and lowercases the rest.
 * - CapitalizeFirstOnly: Capitalizes only the first letter, leaving the rest unchanged.
 * - CheckEmail: Validates if a string is a properly formatted email address.
 * - CheckPassword: Validates if a password meets security requirements (uppercase,
 *   lowercase, digit, special character, length).
 * - StripTags: Removes HTML tags from a string.
 */
export class StringUtils {
  public static readonly chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  public static readonly specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  /**
   * @example
   *   StringUtils.capitalize("hello"); // 'Hello'
   *   StringUtils.capitalize("HELLO"); // 'Hello'
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * @example
   *   StringUtils.checkEmail("test@example.com"); // true
   *   StringUtils.checkEmail("test@example"); // false
   */
  static checkEmail(text: string): boolean {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(text);
  }

  /**
   * CheckPassword
   *
   * Validates if a password meets security requirements.
   *
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one digit
   * - At least one special character
   * - Length between `minLength` and `maxLength`
   *
   * @example
   *   StringUtils.checkPassword("Password123!"); // true
   *   StringUtils.checkPassword("password123!"); // false
   *   StringUtils.checkPassword("Password123!", 10, 20); // false
   */
  static checkPassword(text: string, minLength = 8, maxLength = 64): boolean {
    const strongRegex = new RegExp(
      `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{${minLength},${maxLength}}$`,
    );
    return strongRegex.test(text);
  }

  /**
   * StripTags
   *
   * Removes HTML tags from a string but keeps symbols like `<` and `>`.
   *
   * @example
   *   StringUtils.stripTags("<div>Hello</div>"); // 'Hello'
   */
  static stripTags(text: string): string {
    return text.replace(/<\/?[^>]+(>|$)/g, "");
  }

  /**
   * @example
   *   StringUtils.toTitleCase("hello world"); // 'Hello World'
   */
  static toTitleCase(str: string): string {
    return str
      .split(" ")
      .map((word) => StringUtils.capitalize(word))
      .join(" ");
  }

  /**
   * @example
   *   StringUtils.toCamelCase("Hello World"); // 'helloWorld'
   */
  static toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, "");
  }

  /**
   * @example
   *   StringUtils.toKebabCase("Hello World"); // 'hello-world'
   */
  static toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .toLowerCase();
  }

  /**
   * @example
   *   StringUtils.toSnakeCase("Hello World"); // 'hello_world'
   */
  static toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[\s-]+/g, "_")
      .toLowerCase();
  }

  /**
   * @example
   *   StringUtils.truncate("Hello World", 5); // 'Hello...'
   */
  static truncate(str: string, length: number, suffix = "..."): string {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
  }

  /**
   * @example
   *   StringUtils.truncateWords("Hello World", 2); // 'Hello...'
   *   StringUtils.truncateWords("Hello World", 2, "..."); // 'Hello...'
   */
  static truncateWords(str: string, words: number, suffix = "..."): string {
    return str.split(" ").slice(0, words).join(" ") + suffix;
  }

  /**
   * @example
   *   StringUtils.truncateBetween("Hello World", 2, 5); // 'Hel...ld'
   *   StringUtils.truncateBetween("Hello World", 2, "..."); // 'Hel...ld'
   */
  static truncateBetween(str: string, partLength: number, suffix = "..."): string {
    if (str.length <= 2 * partLength) return str;
    return str.slice(0, partLength) + suffix + str.slice(-partLength);
  }

  /**
   * Converts a string to a URL-friendly slug.
   *
   * @example
   *   StringUtils.slugify("Hello World"); // 'hello-world'
   */
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * @example
   *   StringUtils.removeHtml("<div>Hello</div>"); // 'Hello'
   */
  static removeHtml(str: string): string {
    return str.replace(/<[^>]*>/g, "");
  }

  /**
   * @example
   *   StringUtils.escapeHtml("<div>Hello</div>"); // '&lt;div&gt;Hello&lt;/div&gt;'
   */
  static escapeHtml(str: string): string {
    // prettier-ignore
    const apostrophe = "'";
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      [apostrophe]: "&#39;",
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * @example
   *   StringUtils.unescapeHtml("&lt;div&gt;Hello&lt;/div&gt;"); // '<div>Hello</div>'
   */
  static unescapeHtml(str: string): string {
    // prettier-ignore
    const apostrophe = "'";
    const map: Record<string, string> = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": apostrophe,
    };
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (m) => map[m]);
  }

  /**
   * Formats a sentence to display correctly (capitalize the first letter and uppercase
   * the first letter of each sentence)
   *
   * @example
   *   StringUtils.formatSentence("hello world"); // 'Hello World'
   */
  static formatSentence(str: string): string {
    return str
      .toLowerCase()
      .replace(/^[a-z]/, (char) => char.toUpperCase())
      .replace(/[.!?]\s*[a-z]/g, (match) => match.toUpperCase());
  }

  /**
   * @example
   *   StringUtils.generateId(); // '12345678'
   */
  static generateId(length = 8): string {
    const chars = this.chars;
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * @example
   *   StringUtils.mask("1234567890"); // '******7890'
   */
  static mask(str: string, visibleChars = 4, maskChar = "*"): string {
    if (str.length <= visibleChars) return str;
    const visible = str.slice(-visibleChars);
    const masked = maskChar.repeat(str.length - visibleChars);
    return masked + visible;
  }
}
