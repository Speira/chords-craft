import { type ClassNameValue } from "tailwind-merge";

import { cn } from "~/lib/shadcn";

import { type ITextualComponent, TextualComponent } from "./composites/TextualComponent";

interface TypographyProps
  extends
    React.HTMLAttributes<
      HTMLHeadingElement | HTMLParagraphElement | HTMLSpanElement | HTMLQuoteElement
    >,
    ITextualComponent {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "b" | "span" | "small" | "strong" | "blockquote";
}

const baseClasses: Record<Required<TypographyProps>["as"], ClassNameValue> = {
  h1: "font-prosto scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance",
  h2: "font-prosto scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0",
  h3: "font-prosto scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "font-prosto scroll-m-20 text-xl font-semibold tracking-tight",
  strong: "font-prosto font-semibold",
  p: "leading-7 [&:not(:first-child)]:mt-6",
  b: "font-bold",
  span: "inline-block text-sm",
  small: "text-sm leading-none font-medium",
  blockquote: "mt-6 border-l-2 pl-6 italic",
};

/** @warning: Add "isServer" props when called inside a Client component */
export function Typography(props: TypographyProps) {
  const {
    as = "span",
    children,
    className,
    endNode,
    isServer,
    label,
    startNode,
    ...rest
  } = props;

  const TypographyComponent = as;

  return (
    <TypographyComponent
      className={cn(baseClasses[as], "flex items-center gap-2", className)}
      {...rest}>
      <TextualComponent
        isServer={isServer}
        label={label}
        endNode={endNode}
        startNode={startNode}>
        {children}
      </TextualComponent>
    </TypographyComponent>
  );
}
