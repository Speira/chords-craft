import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export interface AuthContextObject {
  userId: string;
  tenantId: string;
}

export interface AuthResponseObject {
  isAuthorized: boolean;
  deniedFields: Array<string>;
  ttlOverride: number;
  resolverContext?: AuthContextObject;
}

const secretsClient = new SecretsManagerClient({});
let cachedSecret: string | null = null;

/** Clerk is an Auth Provider, we stored its secret in a SecretManager */
export async function getClerkSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const secretName = process.env.CLERK_SECRET_NAME;
  if (!secretName) throw new Error("CLERK_SECRET_NAME not configured");
  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretName }),
  );
  if (!response.SecretString) throw new Error("Secret value is empty");
  cachedSecret = response.SecretString;
  return cachedSecret;
}
