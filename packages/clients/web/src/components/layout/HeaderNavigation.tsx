import { LinkButton } from "../Link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "../ui/navigation-menu";

export async function HeaderNavigation() {
  const navItems: Array<{ href: string; label: string }> = [];

  return (
    <NavigationMenu className="justify-self-center">
      <NavigationMenuList>
        {navItems.map((item) => (
          <NavigationMenuItem key={item.href}>
            <LinkButton href={item.href} variant="link">
              {item.label}
            </LinkButton>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
