"use client";

import { useEffect, useState, useTransition } from "react";

import { Globe } from "lucide-react";
import { useParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components";
import { defaultLocale, localeLabels, usePathname, useRouter } from "~/lib/next-intl";

export const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const paramLocale = (params?.locale as string | undefined) ?? undefined;

  const [currentLocale, setCurrentLocale] = useState<string>(
    paramLocale ?? defaultLocale,
  );

  useEffect(() => {
    if (paramLocale && paramLocale !== currentLocale) {
      setCurrentLocale(paramLocale);
    }
  }, [paramLocale, currentLocale]);

  const handleLocaleChange = (newLocale: string) => {
    setCurrentLocale(newLocale);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <Select value={currentLocale} onValueChange={handleLocaleChange} disabled={isPending}>
      <SelectTrigger title="Language" className="w-36">
        <Globe className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>

      <SelectContent>
        {Object.entries(localeLabels).map(([locale, label]) => (
          <SelectItem key={locale} value={locale}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
