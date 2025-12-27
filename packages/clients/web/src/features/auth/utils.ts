import { enUS, frFR } from "@clerk/localizations";

import { Typeguards } from "@speira/chordschart-shared";

export const clerkLocalesMap: Record<string, typeof enUS> = {
  fr: frFR,
  en: enUS,
};

export const CLERK_LOCALES_STR = ["en-US", "fr-FR"] as const;

export const clerkLocalAdapter = (str: string) => {
  if (str === "fr") return "fr-FR";
  return "en-US";
};

export const defaultClerkLocal = enUS;

export const getClerkError = (err: unknown) => {
  if (!Typeguards.checkIsObject(err)) return "";
  if (!Typeguards.checkIsKeyof(err, "errors")) return "";
  if (!Typeguards.checkIsArray(err.errors)) return "";
  const errorItem = err.errors[0];
  if (!Typeguards.checkIsObject(errorItem)) return "";
  if (!Typeguards.checkIsKeyof(errorItem, "code")) return "";
  if (!Typeguards.checkIsString(errorItem.code)) return "";
  return `auth.error.${errorItem.code}`;
};
