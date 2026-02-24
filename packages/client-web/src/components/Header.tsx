import { type ReactNode } from "react";

import Image from "next/image";

import { HeaderNavigation, LanguageSwitcher, ThemeSwitcher } from "./layout";
import { Typography } from "./Typography";

interface IHeader {
  startNode?: ReactNode;
  endNode?: ReactNode;
}

export async function Header(props: IHeader) {
  const { endNode, startNode } = props;
  return (
    <header className="text-secondary-foreground grid grid-cols-3 p-4 2xl:px-10">
      <div className="flex items-center gap-1.5">
        <div className="relative w-12 h-12">
          <Image
            src="/chart-logo.webp"
            alt="Logo"
            priority
            fill
            className="object-contain"
          />
        </div>
        <Typography
          isServer
          as="strong"
          className="text-primary text-md"
          label="general.title"
        />
        {startNode}
      </div>
      <HeaderNavigation />
      <div className="flex items-center justify-end gap-4">
        <ThemeSwitcher />
        <LanguageSwitcher />
        {endNode}
      </div>
    </header>
  );
}
