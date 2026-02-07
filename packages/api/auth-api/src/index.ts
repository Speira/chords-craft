import { verifyToken } from "@clerk/backend";
import type { AppSyncAuthorizerEvent, AppSyncAuthorizerResult } from "aws-lambda";

import { type AuthContextObject, type AuthResponseObject, getClerkSecret } from "./utils";

const defaultResponse: AuthResponseObject = {
  isAuthorized: false,
  deniedFields: [],
  ttlOverride: 0,
};

export const handler = async (
  event: AppSyncAuthorizerEvent,
): Promise<AppSyncAuthorizerResult<AuthContextObject>> => {
  const token = event.authorizationToken?.replace("Bearer ", "").trim();
  if (!token) {
    return defaultResponse;
  }

  try {
    const secretKey = await getClerkSecret();
    const verified = await verifyToken(token, { secretKey });

    // Single-tenant: userId = tenantId
    // TODO v2: Extract orgId from verified.org_id when multi-tenant
    const context: AuthContextObject = {
      userId: verified.sub,
      tenantId: verified.sub,
    };

    const fullResponse: AuthResponseObject = {
      isAuthorized: true,
      deniedFields: [],
      resolverContext: context,
      ttlOverride: 300,
    };

    return fullResponse;
  } catch (error) {
    console.error("Token verification failed:", error);
    return defaultResponse;
  }
};
