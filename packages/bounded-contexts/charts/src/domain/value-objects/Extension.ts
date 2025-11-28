import { Brand, Effect, ParseResult, Schema } from "effect";

export type Extension = string & Brand.Brand<"Extension">;

export const Delta = "Δ";
const withDelta = (e: Extension) => `${Delta}${e}` as Extension;
// const fromDelta = (e: string) => e.replace(Delta, "Maj");
const toDelta = (e: String) => e.replace("Maj", "M").replace("M", Delta);

export const _6 = "6" as Extension;
export const _7 = "7" as Extension;
export const _9 = "9" as Extension;
export const _11 = "11" as Extension;
export const _13 = "13" as Extension;
export const M7 = withDelta(_7); // "Δ7"
export const M9 = withDelta(_9);
export const M11 = withDelta(_11);
export const M13 = withDelta(_13);

const DOMINANTS = [_6, _7, _9, _11, _13];
const MAJORS = [M7, M9, M11, M13];
export const ALL: Extension[] = [...DOMINANTS, ...MAJORS];

export const schema = Schema.Literal(...ALL);
export const parse = (e: string) => Schema.decodeUnknown(schema)(e);
export const build = (
  str: string
): Effect.Effect<[Extension | undefined, string], ParseResult.ParseError> => {
  return Effect.gen(function* () {
    let extension = ALL.find((ex) => toDelta(str).startsWith(ex));
    if (!extension) return [undefined, str];
    return [extension, str.slice(extension.length)];
  });
};
