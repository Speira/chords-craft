import { type ComponentProps } from "react";

import { type AppTranslation } from "~/lib/next-intl";
import { useAppTranslations } from "~/lib/next-intl/useAppTranslation";

import { Input as UiInput } from "./ui/input";
import { Skeleton } from "./Skeleton";

interface IInput extends ComponentProps<"input"> {
  label?: AppTranslation;
  placeholder?: AppTranslation;
  isLoading?: boolean;
}

export function Input({ isLoading, placeholder, ...props }: IInput) {
  const t = useAppTranslations();

  if (isLoading) return <Skeleton />;

  return (
    <UiInput
      {...props}
      placeholder={placeholder ? t(placeholder) : undefined}
      data-i18nkey={placeholder ?? ""}
    />
  );
}
