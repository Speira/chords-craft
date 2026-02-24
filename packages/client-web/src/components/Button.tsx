import { type AppTranslation } from "~/lib/next-intl";

import { type ITextualComponent, TextualComponent } from "./composites/TextualComponent";
import { Button as UiButton, type ButtonProps } from "./ui/button";

interface IButton extends ButtonProps, ITextualComponent {
  label?: AppTranslation;
}

export function Button(props: IButton) {
  const { children, endNode, isServer, label, startNode, ...rest } = props;
  return (
    <UiButton {...rest}>
      <TextualComponent
        isServer={isServer}
        endNode={endNode}
        label={label}
        startNode={startNode}>
        {children}
      </TextualComponent>
    </UiButton>
  );
}
