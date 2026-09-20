import { LinkButton } from '#client-web/components/Link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '#client-web/components/ui/navigation-menu';
import type { AppTranslation } from '#client-web/lib/nextIntl';

export async function HeaderNavigation() {
  const navItems: Array<{ href: string; label: AppTranslation }> = [
    { href: '/', label: 'home.title' },
    { href: '/charts', label: 'chart.myMusicalCharts' },
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
