"use client";

import { useTranslations } from "next-intl";

import { type AppTranslation } from "./definitions";

export const useAppTranslations = () => {
  return useTranslations<AppTranslation>();
};
