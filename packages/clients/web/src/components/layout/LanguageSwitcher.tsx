"use client";

import { useTransition } from "react";

import { Globe } from "lucide-react";
import { useParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components";
import { localeLabels, usePathname, useRouter } from "~/lib/next-intl";

export const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const currentLocale = params.locale as string;

  const handleLocaleChange = (newLocale: string) => {
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
