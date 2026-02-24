import { Effect, ParseResult, Schema } from "effect";

type GetTransformProps<T> = {
  schema: Schema.SchemaClass<T, T, never>;
  parse: (e: string) => Effect.Effect<T, ParseResult.ParseError, never>;
};

export const getTransform = <T extends string>({ parse, schema }: GetTransformProps<T>) =>
  Schema.transformOrFail(Schema.String, schema, {
    strict: true,
    decode: (str, _, ast) =>
      parse(str).pipe(
        Effect.mapError((error) => new ParseResult.Type(ast, str, error.message)),
      ),
    encode: (data) => Effect.succeed(data),
  });
