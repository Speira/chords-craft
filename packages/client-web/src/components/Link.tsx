import { type HTMLAttributes } from "react";

import { type LinkProps as NextLinkProps } from "next/link";

import { Link as NextLink } from "~/lib/next-intl";

import { type ITextualComponent, TextualComponent } from "./composites/TextualComponent";
import { Button, type ButtonProps } from "./ui/button";

interface LinkProps
  extends
    HTMLAttributes<HTMLAnchorElement>,
    Omit<NextLinkProps, "locale">,
    ITextualComponent {
  children?: React.ReactNode;
  target?: "_blank" | "_self" | "_parent" | "_top";
}
/** @warning: Add "isServer" props when called inside a Client component */
export function Link(props: LinkProps) {
  const { children, endNode, isServer, label, startNode, ...rest } = props;
  return (
    <NextLink {...rest}>
      <TextualComponent
        isServer={isServer}
        label={label}
        endNode={endNode}
        startNode={startNode}>
        {children}
      </TextualComponent>
    </NextLink>
  );
}

interface LinkButtonProps
  extends
    ButtonProps,
    Pick<LinkProps, "href" | "target" | "label" | "startNode" | "endNode">,
    ITextualComponent {
  children?: React.ReactNode;
}
/** @warning: Add "isServer" props when called inside a Client component */
export function LinkButton(props: LinkButtonProps) {
  const { children, endNode, href, isServer, label, startNode, ...rest } = props;
  return (
    <Button asChild {...rest}>
      <NextLink href={href}>
        <TextualComponent
          isServer={isServer}
          endNode={endNode}
          label={label}
          startNode={startNode}>
          {children}
        </TextualComponent>
      </NextLink>
    </Button>
  );
}
