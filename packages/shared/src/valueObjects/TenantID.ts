import { Schema } from "effect";

export const schema = Schema.String.pipe(Schema.minLength(1), Schema.brand("TenantID"));
export type TenantID = typeof schema.Type;
