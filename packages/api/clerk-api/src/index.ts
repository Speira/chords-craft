import { verifyToken } from "@clerk/backend";
import type { AppSyncAuthorizerEvent, AppSyncAuthorizerResult } from "aws-lambda";

type Ctx = {
  userId: string;
  tenantId: string;
  orgId?: string;
};

export const handler = async (
  event: AppSyncAuthorizerEvent,
): Promise<AppSyncAuthorizerResult<Ctx>> => {
  const token = event.authorizationToken?.replace("Bearer ", "").trim();

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!token || !secretKey) {
    throw new Error("Unauthorized");
  }

  try {
    const verified = await verifyToken(token, { secretKey });
    const context: Ctx = { userId: verified.sub, tenantId: verified.sub };
    return {
      isAuthorized: true,
      deniedFields: [],
      resolverContext: context,
      ttlOverride: 300,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Unauthorized");
  }
};
