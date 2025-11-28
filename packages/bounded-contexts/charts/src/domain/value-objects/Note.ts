import { Brand, Effect, ParseResult, Schema } from "effect";

export type Note = string & Brand.Brand<"Note">;

export const SHARP = "♯";
export const FLAT = "♭";
export const addSharp = (l: string) => l.replace(SHARP, "").concat(SHARP);
export const addFlat = (l: string) => l.replace(FLAT, "").concat(FLAT);
export const checkIsSharp = (a: Note) => a.includes(SHARP);
export const checkIsFlat = (a: Note) => a.includes(FLAT);
export const sanitize = (l: string) => l.replace("#", SHARP).replace("b", FLAT);
export const checkAccidental = (str: string) =>
  [SHARP, FLAT, "#", "b"].some((item) => str.includes(item));

export const A = "A" as Note;
export const ASharp = addSharp(A) as Note;
export const AFlat = addFlat(A) as Note;
export const B = "B" as Note;
export const BFlat = addFlat(B) as Note;
export const C = "C" as Note;
export const CSharp = addSharp(C) as Note;
export const D = "D" as Note;
export const DSharp = addSharp(D) as Note;
export const DFlat = addFlat(D) as Note;
export const E = "E" as Note;
export const EFlat = addFlat(E) as Note;
export const F = "F" as Note;
export const FSharp = addSharp(F) as Note;
export const G = "G" as Note;
export const GSharp = addSharp(G) as Note;
export const GFlat = addFlat(G) as Note;

const FlatSharpMap: Record<Note, Note> = { [AFlat]: GSharp, [BFlat]: ASharp, [DFlat]: CSharp, [EFlat]: DSharp, [GFlat]: FSharp, }; // prettier-ignore
const SharpFlatpMap: Record<Note, Note> = { [ASharp]: BFlat, [CSharp]: DFlat, [DSharp]: EFlat, [FSharp]: GFlat, [GSharp]: AFlat, }; // prettier-ignore
export const flatToSharp = (note: Note) => FlatSharpMap[note] ?? note;
export const sharpToFlat = (note: Note) => SharpFlatpMap[note] ?? note;

export const ALL: Note[] = [AFlat, A, ASharp, BFlat, B, C, CSharp, DFlat, D, DSharp, EFlat, E, F, FSharp, GFlat, G, GSharp] as const; // prettier-ignore
export const schema = Schema.Literal(...ALL);
export const checkNote = (a: string): a is Note => ALL.some((v) => a === v);

export const parse = (
  a: string
): Effect.Effect<Note, ParseResult.ParseError> => {
  return Effect.gen(function* () {
    const str = sanitize(a);
    if (checkNote(str)) return str;
    throw new Error(
      `the string "${a}" is not a note (ex: ${A}, ${AFlat}, ${ASharp}, ...)`
    );
  });
};

export const build = (
  str: string
): Effect.Effect<[Note, string], ParseResult.ParseError> => {
  return Effect.gen(function* () {
    const [noteStr, ...afterNote] = str;
    const [maybeAccidental, ...afterAccidental] = afterNote;
    const accidental = [SHARP, FLAT, "#", "b"].includes(maybeAccidental)
      ? maybeAccidental
      : "";
    const strNote = `${noteStr}${accidental}`;
    const note = yield* parse(strNote);
    const restStr = accidental ? afterAccidental.join("") : afterNote.join("");
    return [note, restStr];
  });
};
