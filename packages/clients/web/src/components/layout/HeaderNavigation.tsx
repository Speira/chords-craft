import { type AppTranslation } from "~/lib/next-intl";

import { LinkButton } from "../Link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "../ui/navigation-menu";

export async function HeaderNavigation() {
  const navItems: Array<{ href: string; label: AppTranslation }> = [
    { href: "/", label: "home.title" },
    { href: "/charts", label: "chart.myMusicalCharts" },
  ];

  return (
    <NavigationMenu className="justify-self-center">
      <NavigationMenuList>
        {navItems.map((item) => (
          <NavigationMenuItem key={item.href}>
            <LinkButton href={item.href} variant="link" label={item.label} />
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
