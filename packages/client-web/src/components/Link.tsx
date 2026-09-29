import type { LinkProps as NextLinkProps } from 'next/link';
import type { HTMLAttributes } from 'react';

import { Link as NextLink } from '#client-web/lib/nextIntl';

import { TextualComponent, type TextualComponentProps } from './composites/TextualComponent';
import { Button, type ButtonProps } from './ui/button';

interface LinkProps
  extends HTMLAttributes<HTMLAnchorElement>, Omit<NextLinkProps, 'locale'>, TextualComponentProps {
  children?: React.ReactNode;
  target?: '_blank' | '_self' | '_parent' | '_top';
}
/** @warning: Add "isServer" only when called from a Server component */
export function Link(props: LinkProps) {
  const { children, endNode, isServer, label, startNode, ...rest } = props;
  return (
    <NextLink {...rest}>
      <TextualComponent isServer={isServer} label={label} endNode={endNode} startNode={startNode}>
        {children}
      </TextualComponent>
    </NextLink>
  );
}

interface LinkButtonProps
  extends
    ButtonProps,
    Pick<LinkProps, 'href' | 'target' | 'label' | 'startNode' | 'endNode'>,
    TextualComponentProps {
  children?: React.ReactNode;
}
/** @warning: Add "isServer" only when called from a Server component */
export function LinkButton(props: LinkButtonProps) {
  const { children, endNode, href, isServer, label, startNode, ...rest } = props;
  return (
    <Button asChild {...rest}>
      <NextLink href={href} data-i18nkey={label ?? ''}>
        <TextualComponent isServer={isServer} endNode={endNode} label={label} startNode={startNode}>
          {children}
        </TextualComponent>
      </NextLink>
    </Button>
  );
}
