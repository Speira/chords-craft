import { getTranslations } from "next-intl/server";

import { type AppTranslation } from "./definitions";

export const getAppTranslations = async () => {
  return await getTranslations<AppTranslation>();
};
