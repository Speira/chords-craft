import { type Brand, Schema } from "effect";

export type Section = string & Brand.Brand<"Section">;
export const Intro = "Intro" as Section;
export const Verse = "Verse" as Section;
export const Chorus = "Chorus" as Section;
export const Bridge = "Bridge" as Section;
export const Transition = "Transition" as Section;
export const Interlude = "Interlude" as Section;
export const Ending = "Ending" as Section;
export const ALL: Array<Section> = [
  Intro,
  Verse,
  Chorus,
  Bridge,
  Transition,
  Interlude,
  Ending,
];
export const schema = Schema.Literal(...ALL);
export const parse = (s: string) => Schema.decodeUnknown(schema)(s);
