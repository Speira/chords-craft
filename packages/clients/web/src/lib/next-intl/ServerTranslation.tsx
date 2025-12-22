import { type AppTranslation } from "./definitions";
import { getAppTranslations } from "./getAppTranslation";

export async function ServerTranslation({ label }: { label: AppTranslation }) {
  const t = await getAppTranslations();
  return <>{t(label)}</>;
}
