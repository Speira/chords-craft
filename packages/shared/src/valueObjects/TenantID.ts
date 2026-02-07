import { Schema } from "effect";

export const schema = Schema.String.pipe(Schema.brand("TenantID"));
export type TenantID = typeof schema.Type;
