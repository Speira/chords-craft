import { verifyToken } from "@clerk/backend";
import type { AppSyncAuthorizerEvent } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handler } from "../src/index";
import { getClerkSecret } from "../src/utils";

vi.mock("@clerk/backend", () => ({ verifyToken: vi.fn() }));
vi.mock("../src/utils", () => ({ getClerkSecret: vi.fn() }));

const makeEvent = (authorizationToken: string | null): AppSyncAuthorizerEvent =>
  ({ authorizationToken }) as unknown as AppSyncAuthorizerEvent;

// Shared module-level mocks make these tests order-sensitive; keep them serial.
describe.sequential("api-auth handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClerkSecret).mockResolvedValue("sk_test_secret");
  });

  it("denies when no authorization token is present", async () => {
    const result = await handler(makeEvent(null));

    expect(result.isAuthorized).toBe(false);
    expect(result.resolverContext).toBeUndefined();
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("denies an empty bearer token", async () => {
    const result = await handler(makeEvent("Bearer "));

    expect(result.isAuthorized).toBe(false);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("authorizes a valid token and maps sub to both userId and tenantId", async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: "user_123" } as never);

    const result = await handler(makeEvent("Bearer good.jwt.token"));

    expect(result.isAuthorized).toBe(true);
    expect(result.resolverContext).toEqual({ userId: "user_123", tenantId: "user_123" });
    expect(result.ttlOverride).toBe(300);
  });

  it("denies (does not throw) when token verification fails", async () => {
    vi.mocked(verifyToken).mockRejectedValue(new Error("token expired"));

    const result = await handler(makeEvent("Bearer bad.jwt.token"));

    expect(result.isAuthorized).toBe(false);
    expect(result.resolverContext).toBeUndefined();
  });
});
