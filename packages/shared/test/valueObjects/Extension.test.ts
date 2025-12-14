import { Effect, Exit } from "effect";

import { describe, expect, it } from "vitest";

import { Extension } from "../../src";

describe("Extension tests suite", () => {
  it("Should have extensions defined", () => {
    expect(Extension._6).toBe("6");
    expect(Extension._7).toBe("7");
    expect(Extension._9).toBe("9");
    expect(Extension._11).toBe("11");
    expect(Extension._13).toBe("13");
  });

  it("Should parse a extension string to Extension", async () => {
    const str = "7";
    const parsing = Extension.parse(str);
    const result = await Effect.runPromise(parsing);
    expect(result).toEqual(Extension._7);
  });

  it("Should return an Effect Error when parsing a non extension string", async () => {
    const str = "???";
    const parsing = Extension.parse(str);
    const result = await Effect.runPromiseExit(parsing);
    if (Exit.isFailure(result)) {
      expect(result.cause).toBeDefined();
    } else {
      expect.fail("Should fail");
    }
  });
});
