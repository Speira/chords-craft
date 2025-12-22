import { type ComponentProps } from "react";

import { type AppTranslation } from "~/lib/next-intl";
import { useAppTranslations } from "~/lib/next-intl/useAppTranslation";

import { Input as UiInput } from "./ui/input";

interface IInput extends ComponentProps<"input"> {
  label?: AppTranslation;
  placeholder?: AppTranslation;
}

export function Input(props: IInput) {
  const t = useAppTranslations();
  return (
    <UiInput
      {...props}
      placeholder={props.placeholder ? t(props.placeholder) : undefined}
    />
  );
}
