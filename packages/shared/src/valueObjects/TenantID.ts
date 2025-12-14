import { Schema } from "effect";

export const TenantID = Schema.String.pipe(Schema.brand("TenantID"));
export type TenantID = typeof TenantID.Type;
