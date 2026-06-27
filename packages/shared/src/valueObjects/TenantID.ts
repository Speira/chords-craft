import { Schema } from "effect";

export const schema = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(255),
  Schema.filter((s) => s.trim().length > 0, {
    message: () => "Expected a non-blank TenantID",
  }),
  Schema.brand("TenantID"),
);
export type TenantID = typeof schema.Type;
