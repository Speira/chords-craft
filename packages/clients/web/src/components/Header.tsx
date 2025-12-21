import { HeaderNavigation, LanguageSwitcher, ThemeSwitcher } from "./layout";

export async function Header() {
  return (
    <header className="text-secondary-foreground grid grid-cols-3 p-4 2xl:px-10">
      <div />
      <HeaderNavigation />
      <div className="flex items-center justify-end gap-4">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
