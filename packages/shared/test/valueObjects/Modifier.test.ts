import { Effect, Exit } from "effect";

import { describe, expect, it } from "vitest";

import { Modifier } from "../../src";

describe("Modifier tests suite", () => {
  it("Should have modifiers values", () => {
    expect(Modifier.Flat5).toBe("♭5");
    expect(Modifier.Sharp5).toBe("♯5");
    expect(Modifier.Flat9).toBe("♭9");
    expect(Modifier.Sharp9).toBe("♯9");
    expect(Modifier.Sharp11).toBe("♯11");
    expect(Modifier.Flat11).toBe("♭11");
    expect(Modifier.Flat13).toBe("♭13");
    expect(Modifier.Sharp13).toBe("♯13");
  });

  it("Should parse a modifier string to Modifier", async () => {
    const str = "♭11";
    const str2 = "b11";
    const parsing = Modifier.parse(str);
    const parsing2 = Modifier.parse(str2);
    const result = await Effect.runPromise(parsing);
    const result2 = await Effect.runPromise(parsing2);
    expect(result).toEqual(Modifier.Flat11);
    expect(result2).toEqual(Modifier.Flat11);
  });

  it("Should return an Effect Error when parsing a non modifier string", async () => {
    const str = "???";
    const parsing = Modifier.parse(str);
    const result = await Effect.runPromiseExit(parsing);
    if (Exit.isFailure(result)) {
      expect(result.cause).toBeDefined();
    } else {
      expect.fail("Should fail");
    }
  });
});
