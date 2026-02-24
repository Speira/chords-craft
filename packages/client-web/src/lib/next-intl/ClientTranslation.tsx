"use client";

import { type AppTranslation } from "./definitions";
import { useAppTranslations } from "./useAppTranslation";

export function ClientTranslation({ label }: { label: AppTranslation }) {
  const t = useAppTranslations();
  return <>{t(label)}</>;
}
