import { type HTMLAttributes } from "react";

import { type LinkProps as NextLinkProps } from "next/link";

import { type AppTranslation, Link as NextLink } from "~/lib/next-intl";

import { Button, type ButtonProps } from "./ui/button";

interface LinkProps
  extends HTMLAttributes<HTMLAnchorElement>, Omit<NextLinkProps, "locale"> {
  children?: React.ReactNode;
  target?: "_blank" | "_self" | "_parent" | "_top";
  label?: AppTranslation;
}
export function Link({ children, ...props }: LinkProps) {
  return <NextLink {...props}>{children}</NextLink>;
}

interface LinkButtonProps
  extends ButtonProps, Pick<LinkProps, "href" | "target" | "label"> {
  children?: React.ReactNode;
}
export function LinkButton({ children, href, label, ...props }: LinkButtonProps) {
  return (
    <Button asChild {...props}>
      <NextLink href={href}>
        {label}
        {children}
      </NextLink>
    </Button>
  );
}
