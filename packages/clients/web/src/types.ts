import { type AppTranslation } from "./lib/next-intl";

/** Uniformization of a response, the first field is usually the error */
export type HandledResponse<T = unknown> = [AppTranslation | null, T];
