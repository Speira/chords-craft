# @chordcraft/client-web

The web client: [Next.js 16](https://nextjs.org) App Router on React 19, talking to AppSync
through `graphql-request`.

## Getting started

From the repository root:

```sh
pnpm install
pnpm dev:web          # or `pnpm dev` to run the api packages alongside it
```

The app serves on [http://localhost:3000](http://localhost:3000) and redirects to a locale
prefix (`/en`, `/fr`). Routes live in `src/app/[locale]`.

Package-local scripts (`pnpm --filter @chordcraft/client-web <script>`): `dev`, `build`,
`start`, `typecheck`, `lint`, `format`. Lint, format, typecheck and tests for the whole repo
run from the root — see `pnpm check`.

## Layout

```bash
src/
  ├── app/[locale]/       # App Router routes, layout and globals.css (design tokens)
  ├── components/         # Our components; `components/ui` is shadcn-generated
  ├── features/           # Screen-level features (auth, chart)
  ├── hooks/              # Shared hooks
  ├── lib/                # nextIntl (i18n), graphql client, logger, shadcn helpers
  ├── proxy.ts            # next-intl + Clerk middleware
  └── constants.ts        # K.* constants, including the one literal brand colour
```

## Conventions

- **Imports** use the package alias `#client-web/*` (declared in `package.json` `imports`),
  never a relative path across directories.
- **Design tokens** are the contract: see [DESIGN.md](./DESIGN.md). Never hardcode a colour,
  radius or font size — reference the CSS variable, and add it to `globals.css` first.
- **`src/components/ui/*` is generated** by the shadcn CLI. Do not hand-edit; re-add with
  `pnpm dlx shadcn@latest add <name>`.
- **Every user-visible string is translated** through `next-intl` (FR/EN). See
  [`src/lib/nextIntl/README.md`](./src/lib/nextIntl/README.md).
- **Auth** is Clerk (`@clerk/nextjs`); the session token is what the AppSync Lambda
  authorizer verifies.

## Environment

Copy `env.example` to `.env.local` and fill it in. It covers the Clerk keys and redirect
URLs; the app does not start without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and
`CLERK_SECRET_KEY`.

`src/lib/graphql` also reads **`NEXT_PUBLIC_GRAPHQL_URL`** and throws
`No graphql endpoint defined` without it. Take the value from the stack's `GraphQLApiUrl`
output (`pnpm --filter @chordcraft/deployment cdk deploy` prints it).
