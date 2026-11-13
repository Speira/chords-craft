# @chordcraft/deployment

The AWS CDK stack for ChordsChart (`eu-west-3`). It provisions the DynamoDB tables, the
AppSync GraphQL API, the Lambda functions and their roles, the S3 buckets and the monitoring.

## Stack layout

```bash
bin/
  ├── app.ts              # CDK entry point (see cdk.json)
  └── mergeSchemas.ts     # Merges each context's schema into src/generated
src/
  ├── ChordsChartStack.ts # The stack, composed from the constructs below
  ├── constants.ts
  ├── constructParts/     # AppSync, Database, Lambdas, Monitoring, Role, Security, Storage
  └── generated/          # schema.graphql — generated, do not edit by hand
```

## The generated schema

`src/generated/schema.graphql` is **build output**, not a source file: `mergeSchemas.ts`
merges (with `@graphql-tools/merge`, so each root type is declared once) `packages/*/src/interface/graphql/schema.graphql` for every context listed in
its `CONTEXTS_PATHS`. Edit the context's schema, then regenerate:

```sh
pnpm merge-schemas
```

`deploy:dev`, `deploy:prod` and `synth` run it first, so a deploy never ships a stale schema.

## Useful commands

- `pnpm build` — compile TypeScript
- `pnpm watch` — compile on change
- `pnpm test` — the stack's unit tests (this package still runs **jest**, not the repo's
  vitest; it is not part of the root vitest projects)
- `pnpm merge-schemas` — regenerate `src/generated/schema.graphql`
- `pnpm synth` — merge schemas, then emit the CloudFormation template
- `pnpm deploy:dev` / `pnpm deploy:prod` — merge schemas, then `cdk deploy`. The target comes
  from the `env` CDK context: absent → `dev` (stack `ChordsChart-dev`), `--context env=prod` →
  `ChordsChart-prod`. Any other value fails the synth (`src/environment.ts`), so a typo cannot
  deploy a dev-configured stack under another name.
- `pnpm cdk diff` — compare the deployed stack with the current state

## Lambda code assets

Each function is a `NodejsFunction`: at synth time the CDK bundles
`packages/api-*/src/index.ts` with esbuild (the `esbuild` devDependency, no Docker) into one
CommonJS file with a source map. The bundle carries the workspace packages and every npm
dependency, the AWS SDK v3 included (`externalModules: []`), so the deployed SDK is the one in
the lockfile rather than whatever the runtime ships. All three functions run on Node 22.

The workspace packages are resolved through their `exports`, which still point at `./build`,
so run `pnpm build` at the root before `synth` or `deploy` (the deploy workflow does). Making
them source-first is tracked as a deliberate deviation in [MIGRATION.md](../../MIGRATION.md).

## Clerk configuration

The authorizer reads two custom claims that Clerk's default session token does not carry. In
the Clerk dashboard (both the development and the production instance): **Sessions →
Customize session token**, and set:

```json
{
  "email": "{{user.primary_email_address}}",
  "email_verified": "{{user.email_verified}}"
}
```

Check the preview shows `email_verified` as a boolean. If it shows `null`, every user is
treated as unverified and saving a profile fails with a `VALIDATION` error on `email` until the
claim resolves to `true`. Accepting a band invitation (phase 5) also requires a verified email.
