# @chordcraft/deployment

The AWS CDK stack for ChordsChart (`eu-west-3`). It provisions the DynamoDB tables, the
AppSync GraphQL API, the Lambda functions and their roles, the S3 buckets and the monitoring.

## Stack layout

```bash
bin/
  ├── app.ts              # CDK entry point (see cdk.json)
  └── mergeSchemas.ts     # Concatenates each context's schema into src/generated
src/
  ├── ChordsChartStack.ts # The stack, composed from the constructs below
  ├── constants.ts
  ├── constructParts/     # AppSync, Database, Lambdas, Monitoring, Role, Security, Storage
  └── generated/          # schema.graphql — generated, do not edit by hand
```

## The generated schema

`src/generated/schema.graphql` is **build output**, not a source file: `mergeSchemas.ts`
concatenates `packages/*/src/interface/graphql/schema.graphql` for every context listed in
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
- `pnpm deploy:dev` / `pnpm deploy:prod` — merge schemas, then `cdk deploy`
- `pnpm cdk diff` — compare the deployed stack with the current state

## Lambda code assets

The CDK ships `packages/api-*/build` directly as the Lambda code asset
(`lambda.Code.fromAsset`, no bundler), so `pnpm build` at the root is part of the deploy
path. Making the packages source-first would mean bundling the lambdas first — tracked as a
deliberate deviation in [MIGRATION.md](../../MIGRATION.md).
