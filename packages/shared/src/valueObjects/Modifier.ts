import { type Brand, Schema } from "effect";

import * as Note from "./Note";

export type Modifier = string & Brand.Brand<"Modifier">;

export const Flat5 = Note.FLAT.concat("5") as Modifier;
export const Sharp5 = Note.SHARP.concat("5") as Modifier;
export const Flat9 = Note.FLAT.concat("9") as Modifier;
export const Sharp9 = Note.SHARP.concat("9") as Modifier;
export const Flat11 = Note.FLAT.concat("11") as Modifier;
export const Sharp11 = Note.SHARP.concat("11") as Modifier;
export const Flat13 = Note.FLAT.concat("13") as Modifier;
export const Sharp13 = Note.SHARP.concat("13") as Modifier;

export const ALL: Array<Modifier> = [
  Flat5,
  Sharp5,
  Flat9,
  Sharp9,
  Flat11,
  Sharp11,
  Flat13,
  Sharp13,
];
export const schema = Schema.Literal(...ALL);
export const parse = (m: string) =>
  Schema.decodeUnknown(schema)(Note.sanitize(m));
