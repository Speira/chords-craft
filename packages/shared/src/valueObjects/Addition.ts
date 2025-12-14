import { type Brand, Schema } from "effect";

export type Addition = string & Brand.Brand<"Addition">;

export const add13 = "add13" as Addition;
export const add11 = "add11" as Addition;
export const add9 = "add9" as Addition;

export const ALL_ADDITIONS: Array<Addition> = [add13, add11, add9];
export const schema = Schema.Literal(...ALL_ADDITIONS);
export const parse = (a: string) => Schema.decodeUnknown(schema)(a);
