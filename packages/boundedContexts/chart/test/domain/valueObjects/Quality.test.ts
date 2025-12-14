import { Effect } from "effect";

import { describe, expect, it } from "vitest";

import { Quality } from "../../../src/domain/valueObjects";

describe("Quality tests suite", () => {
  it("Should have all the quality values", () => {
    expect(Quality.Minor).toBe("m");
    expect(Quality.Major).toBe("");
    expect(Quality.Diminished).toBe("°");
    expect(Quality.Augmented).toBe("+");
    expect(Quality.Sus2).toBe("sus2");
    expect(Quality.Sus4).toBe("sus4");
  });

  it("Should build from Chord after note correclty", async () => {
    const afterNote = "7add9";
    const [quality, afterQuality] = await Effect.runPromise(
      Quality.build(afterNote)
    );
    expect(quality).toBe(Quality.Major);
    expect(afterQuality).toBe("7add9");
  });

  it("Should build from minor Chord after note correclty", async () => {
    const afterNote = "m7";
    const [quality, afterQuality] = await Effect.runPromise(
      Quality.build(afterNote)
    );
    expect(quality).toBe(Quality.Minor);
    expect(afterQuality).toBe("7");
  });

  it("Should build from diminished Chord after note correclty", async () => {
    const afterNote = "°";
    const [quality, afterQuality] = await Effect.runPromise(
      Quality.build(afterNote)
    );
    expect(quality).toBe(Quality.Diminished);
    expect(afterQuality).toBe("");
  });

  it("Should build from sus4 Chord after note correclty", async () => {
    const afterNote = "sus4";
    const [quality, afterQuality] = await Effect.runPromise(
      Quality.build(afterNote)
    );
    expect(quality).toBe(Quality.Sus4);
    expect(afterQuality).toBe("");
  });
});
