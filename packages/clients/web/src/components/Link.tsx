import { type HTMLAttributes } from "react";

import { type LinkProps as NextLinkProps } from "next/link";

import { type AppTranslation, Link as NextLink } from "~/lib/next-intl";
import { getAppTranslations } from "~/lib/next-intl/getAppTranslation";

import { Button, type ButtonProps } from "./ui/button";

interface LinkProps
  extends HTMLAttributes<HTMLAnchorElement>, Omit<NextLinkProps, "locale"> {
  children?: React.ReactNode;
  target?: "_blank" | "_self" | "_parent" | "_top";
  label?: AppTranslation;
}
export async function Link({ children, label, ...props }: LinkProps) {
  const t = await getAppTranslations();
  return (
    <NextLink {...props}>
      {!!label && t(label)}
      {children}
    </NextLink>
  );
}

interface LinkButtonProps
  extends ButtonProps, Pick<LinkProps, "href" | "target" | "label"> {
  children?: React.ReactNode;
}
export async function LinkButton({ children, href, label, ...props }: LinkButtonProps) {
  const t = await getAppTranslations();
  return (
    <Button asChild {...props}>
      <NextLink href={href}>{label ? t(label) : children}</NextLink>
    </Button>
  );
}
