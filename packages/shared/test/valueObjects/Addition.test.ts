import { Effect, Exit } from "effect";

import { describe, expect, it } from "vitest";

import { Addition } from "../../src";

describe("Addition tests suite", () => {
  it("Should have additions values", () => {
    expect(Addition.add9).toBe("add9");
    expect(Addition.add11).toBe("add11");
    expect(Addition.add13).toBe("add13");
  });

  it("Should parse a addition string to Addition", async () => {
    const str = "add13";
    const parsing = Addition.parse(str);
    const result = await Effect.runPromise(parsing);
    expect(result).toEqual(Addition.add13);
  });

  it("Should return an Effect Error when parsing a non addition string", async () => {
    const str = "???";
    const parsing = Addition.parse(str);
    const result = await Effect.runPromiseExit(parsing);
    if (Exit.isFailure(result)) {
      expect(result.cause).toBeDefined();
    } else {
      expect.fail("Should fail");
    }
  });
});
