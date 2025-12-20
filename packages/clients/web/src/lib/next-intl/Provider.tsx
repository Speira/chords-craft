import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { checkIsLocale, defaultLocale } from "./definitions";

interface I18nProviderProps {
  children: React.ReactNode;
  locale: string;
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
  let currentLocale = locale;
  if (!checkIsLocale(locale)) {
    currentLocale = defaultLocale;
  }
  setRequestLocale(currentLocale);
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
