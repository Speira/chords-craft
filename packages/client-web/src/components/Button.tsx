import type { AppTranslation } from '#client-web/lib/nextIntl';

import { TextualComponent, type TextualComponentProps } from './composites/TextualComponent';
import { Button as UiButton, type ButtonProps as UiButtonProps } from './ui/button';

interface ButtonProps extends UiButtonProps, TextualComponentProps {
  label?: AppTranslation;
}

export function Button(props: ButtonProps) {
  const { children, endNode, isServer, label, startNode, ...rest } = props;
  return (
    <UiButton {...rest} data-i18nkey={label ?? ''}>
      <TextualComponent isServer={isServer} endNode={endNode} label={label} startNode={startNode}>
        {children}
      </TextualComponent>
    </UiButton>
  );
}
