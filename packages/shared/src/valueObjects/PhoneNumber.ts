import { ParseResult, Schema } from 'effect';

import { parsePhoneNumberFromString } from 'libphonenumber-js';

const E164 = Schema.String.pipe(Schema.pattern(/^\+[1-9]\d{6,14}$/), Schema.brand('PhoneNumber'));

/**
 * An international number, stored in E.164 (`+33612345678`). A national number (`06…`) is rejected:
 * without its country code it cannot be dialled from a deep link.
 */
export const schema = Schema.transformOrFail(Schema.String, E164, {
  strict: true,
  decode: (input, _, ast) => {
    const phone = parsePhoneNumberFromString(input);
    return phone?.isValid()
      ? ParseResult.succeed(phone.number)
      : ParseResult.fail(
          new ParseResult.Type(
            ast,
            input,
            `"${input}" is not an international phone number (e.g. +33612345678)`,
          ),
        );
  },
  encode: ParseResult.succeed,
});
export type PhoneNumber = typeof schema.Type;
