import type { ReactNode } from 'react';

import {
  type AppTranslation,
  ClientTranslation,
  ServerTranslation,
} from '#client-web/lib/nextIntl';

export interface TextualComponentProps {
  children?: ReactNode;
  /** Decorational node */
  endNode?: ReactNode;
  /**
   * Help Typography to call the right TranslationComponent. Set it only from a Server component: it
   * renders the async `ServerTranslation` (better SEO), which throws inside a Client component.
   */
  isServer?: boolean;
  /** The label code corresponding to the translation key */
  label?: AppTranslation;
  /** Decorational node */
  startNode?: ReactNode;
}

/** Internal component to display translated text whithout html tag */
export function TextualComponent(props: TextualComponentProps) {
  const { children, endNode, isServer, label, startNode } = props;
  return (
    <>
      {startNode}
      {!!label && isServer && <ServerTranslation label={label} />}
      {!!label && !isServer && <ClientTranslation label={label} />}
      {children}
      {endNode}
    </>
  );
}
