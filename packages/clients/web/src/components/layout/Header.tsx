import { Link } from "../Link";
import { Typography } from "../Typography";

import { HeaderNavigation } from "./HeaderNavigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

export async function Header() {
  return (
    <header className="bg-secondary text-secondary-foreground grid grid-cols-3 p-4 2xl:px-10">
      <Link href="/">
        <Typography as="h2" label="general.title" />
      </Link>

      <HeaderNavigation />

      <div className="flex items-center justify-end gap-4">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
