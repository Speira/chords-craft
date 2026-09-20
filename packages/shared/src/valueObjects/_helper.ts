import { Effect, ParseResult, Schema } from 'effect';

interface GetTransformProps<T> {
  schema: Schema.SchemaClass<T, T>;
  parse: (e: string) => Effect.Effect<T, ParseResult.ParseError>;
}

export const getTransform = <T extends string>({ parse, schema }: GetTransformProps<T>) =>
  Schema.transformOrFail(Schema.String, schema, {
    strict: true,
    decode: (str, _, ast) =>
      parse(str).pipe(Effect.mapError((error) => new ParseResult.Type(ast, str, error.message))),
    encode: (data) => Effect.succeed(data),
  });
