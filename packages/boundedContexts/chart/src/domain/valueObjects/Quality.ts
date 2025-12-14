import { type Brand, Effect, type ParseResult, Schema } from "effect";

export type Quality = string & Brand.Brand<"Quality">;

export const Minor = "m" as Quality;
export const Major = "" as Quality;
export const Diminished = "°" as Quality;
export const Augmented = "+" as Quality;
export const Sus2 = "sus2" as Quality;
export const Sus4 = "sus4" as Quality;

export const ALL: Array<Quality> = [
  Major,
  Minor,
  Diminished,
  Augmented,
  Sus2,
  Sus4,
];

export const schema = Schema.Literal(...ALL);
export const parse = (q: string) => Schema.decodeUnknown(schema)(q);

export const build = (
  str: string
): Effect.Effect<[Quality, string], ParseResult.ParseError> => {
  let quality = "";
  if (str.startsWith(Minor)) quality = Minor;
  if (str.startsWith(Diminished)) quality = Diminished;
  if (str.startsWith(Augmented)) quality = Augmented;
  if (str.startsWith(Sus2)) quality = Sus2;
  if (str.startsWith(Sus4)) quality = Sus4;
  if (quality)
    return Effect.succeed([quality as Quality, str.slice(quality.length)]);
  return Effect.succeed([Major, str]);
};
