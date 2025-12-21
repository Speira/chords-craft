import { type PropsWithChildren } from "react";

import { cn } from "~/lib/shadcn";

/** Main component to display any page content directly inside the layout */
export function Main({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <main
      className={cn(
        "flex grow flex-col items-center justify-start gap-2 p-8 pb-20 font-sans sm:p-15",
        className,
      )}>
      {children}
    </main>
  );
}
