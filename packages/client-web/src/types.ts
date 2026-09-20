import type { AppTranslation } from './lib/nextIntl';

/** Uniformization of a response, the first field is usually the error */
export type HandledResponse<T = unknown> = [AppTranslation | null, T];
