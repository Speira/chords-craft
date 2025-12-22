import { type ReactNode } from "react";

import {
  type AppTranslation,
  ClientTranslation,
  ServerTranslation,
} from "~/lib/next-intl";

export interface ITextualComponent {
  children?: ReactNode;
  /** Decorational node */
  endNode?: ReactNode;
  /**
   * Help Typography to call the right TranslationComponent, isServer allows a better SEO
   * but throw error when called in client component
   */
  isServer?: boolean;
  /** The label code corresponding to the translation key */
  label?: AppTranslation;
  /** Decorational node */
  startNode?: ReactNode;
}

export function TextualComponent(props: ITextualComponent) {
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
