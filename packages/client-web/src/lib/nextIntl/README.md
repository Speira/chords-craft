# Internationalization (i18n) Library

The complete internationalization setup, with autocomplete, built on
[next-intl](https://next-intl-docs.vercel.app/).

## Overview

The i18n library provides:

- **Multi-language support** (English & French)
- **Type-safe translations** — `AppTranslation` is derived from `dictionaries/en.json`, so
  every key is checked and autocompleted
- **Server and client-side** translation utilities
- **Automatic locale detection** and routing (through `src/proxy.ts`)
- **SEO-friendly** URL structure with locale prefixes

## Files

| File                                      | Role                                                          |
| ----------------------------------------- | ------------------------------------------------------------- |
| `definitions.ts`                          | `locales`, `defaultLocale`, `checkIsLocale`, `AppTranslation` |
| `request.ts`                              | `routing` + the locale-aware navigation exports               |
| `Provider.tsx`                            | `I18nProvider`, mounted in `app/[locale]/layout.tsx`          |
| `ServerTranslation` / `ClientTranslation` | Render one key; picked by `TextualComponent`                  |
| `getAppTranslation.ts`                    | `getAppTranslations()` for server components                  |
| `useAppTranslation.ts`                    | `useAppTranslations()` for client components                  |
| `dictionaries/{en,fr}.json`               | The translations themselves                                   |

The barrel (`#client-web/lib/nextIntl`) re-exports everything **except** the two translation
accessors — import those from their own module, as shown below.

## Usage

### Preferred: the `Typography` component

Most UI text should not call a translation hook at all. `components/Typography.tsx` takes a
translation `label` and renders it through `TextualComponent`:

```tsx
import { Typography } from '#client-web/components/Typography';

<Typography as="h2" label="general.title" />;
```

Pass `isServer` when rendering it from a server component.

### Server Components

```tsx
import { getAppTranslations } from '#client-web/lib/nextIntl/getAppTranslation';

export default async function MyPage() {
  const t = await getAppTranslations();

  return <h1>{t('general.title')}</h1>;
}
```

### Client Components

```tsx
'use client';
import { useAppTranslations } from '#client-web/lib/nextIntl/useAppTranslation';

export function MyPage() {
  const t = useAppTranslations();

  return <h2>{t('general.title')}</h2>;
}
```

### Navigation

Use these instead of `next/link` and `next/navigation` so the current locale is preserved:

```tsx
import { Link, usePathname, useRouter } from '#client-web/lib/nextIntl';

// Locale-aware Link component
<Link href="/test">Test</Link>;

// Programmatic navigation
const router = useRouter();
const pathname = usePathname();

router.push('/test'); // Maintains current locale
```

`redirect` and `getPathname` are exported from the same module.

## Adding a translation

1. Add the key to `dictionaries/en.json` **and** `dictionaries/fr.json` — `AppTranslation`
   is derived from the English file, so a key missing there is a type error at the call site.
2. Reference it by its dotted path (`general.title`).

Never hardcode a user-visible string.
