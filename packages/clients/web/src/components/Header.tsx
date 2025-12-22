import { type ReactNode } from "react";

import { HeaderNavigation, LanguageSwitcher, ThemeSwitcher } from "./layout";

interface IHeader {
  startNode?: ReactNode;
  endNode?: ReactNode;
}

export async function Header(props: IHeader) {
  const { endNode, startNode } = props;
  return (
    <header className="text-secondary-foreground grid grid-cols-3 p-4 2xl:px-10">
      <div>{startNode}</div>
      <HeaderNavigation />
      <div className="flex items-center justify-end gap-4">
        <ThemeSwitcher />
        <LanguageSwitcher />
        {endNode}
      </div>
    </header>
  );
}
