# Internationalization (i18n) Library

This directory contains the complete internationalization setup with autocomplete using [next-intl](https://next-intl-docs.vercel.app/).

## Overview

The i18n library provides:

- **Multi-language support** (English & French)
- **Type-safe translations** with full TypeScript support
- **Server and client-side** translation utilities
- **Automatic locale detection** and routing
- **SEO-friendly** URL structure with locale prefixes

## Usage

### Server Components

```typescript
import { getAppTranslations } from '~/utils/i18n';

export default async function MyPage() {
  const t = await getAppTranslations();

  return (
    <div>
      <h1>{t('general.title')}</h1>
    </div>
  );
}
```

### Client Components

```typescript
'use client';
import { useAppTranslations } from '~/utils/i18n';

export function MyPage() {
  const t = useAppTranslations();

  return (
    <div>
      <h2>{t('general.title')}</h2>
    </div>
  );
}
```

### Navigation

```typescript
import { Link, useRouter, usePathname } from '~/utils/i18n';

// Locale-aware Link component
<Link href="/test">Test</Link>

// Programmatic navigation
const router = useRouter();
const pathname = usePathname();

router.push('/test'); // Maintains current locale
```

### Language Switching

```typescript
'use client';
import { useRouter, usePathname } from '~/utils/i18n';

function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (locale: string) => {
    router.replace(pathname, { locale });
  };

  return (
    <select onChange={(e) => switchLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="fr">Français</option>
    </select>
  );
}
```
