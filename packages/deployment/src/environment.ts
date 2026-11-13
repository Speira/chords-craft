import type { Node } from 'constructs';

const ENVIRONMENTS = ['dev', 'prod'] as const;

type Environment = (typeof ENVIRONMENTS)[number];

function checkIsEnvironment(value: unknown): value is Environment {
  return (ENVIRONMENTS as ReadonlyArray<unknown>).includes(value);
}

/**
 * Reads the `env` CDK context (`--context env=prod`). Absent means `dev`; any other value than
 * `dev` or `prod` throws, so a typo such as `env=production` cannot deploy a dev-configured stack
 * under a name that looks like production.
 */
export function resolveEnvironment(node: Node): Environment {
  const value: unknown = node.tryGetContext('env');
  if (value === undefined) return 'dev';
  if (checkIsEnvironment(value)) return value;
  throw new Error(
    `Unknown CDK context env=${JSON.stringify(value)}; expected one of: ${ENVIRONMENTS.join(', ')}`,
  );
}
