import type { NestedKeyOf } from "next-intl";

import type enTranslations from "./dictionaries/en.json";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

export const defaultLocale: Locale = "en";

export const checkIsLocale = (locale: string): locale is Locale => {
  // eslint-disable-next-line unicorn/prefer-includes -- `includes` would require the
  // argument to already be a Locale, which is what this guard is establishing.
  return locales.some((l) => l === locale);
};

type EnglishTranslations = typeof enTranslations;

export type AppTranslation = NestedKeyOf<EnglishTranslations>;

/** Type for specific namespace keys @example TranslationKeyType<'auth'> */
export type TranslationKeyType<T extends keyof EnglishTranslations> = NestedKeyOf<
  EnglishTranslations[T]
>;
