import { hasLocale } from "next-intl";
import { defineRouting } from "next-intl/routing";
import { getRequestConfig, type GetRequestConfigParams } from "next-intl/server";

import { locales } from "./definitions";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,
  // Used when no locale matches
  defaultLocale: "en",
  // Always show the locale in the URL
  localePrefix: "always",
});

const request = getRequestConfig(async (params: GetRequestConfigParams) => {
  const { requestLocale } = params;

  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    messages: (await import(`./dictionaries/${locale}.json`)).default,
    locale,
  };
});

export default request;
