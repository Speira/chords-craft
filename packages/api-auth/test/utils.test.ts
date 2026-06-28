import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();

vi.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: vi.fn(() => ({ send })),
  GetSecretValueCommand: vi.fn((args: unknown) => args),
}));

// getClerkSecret memoizes in module scope; reset the module per test so the
// cache starts empty, and keep the suite serial since it mutates process.env.
describe.sequential("getClerkSecret", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.CLERK_SECRET_NAME;
  });

  it("throws when CLERK_SECRET_NAME is not configured", async () => {
    const { getClerkSecret } = await import("../src/utils");

    await expect(getClerkSecret()).rejects.toThrow("CLERK_SECRET_NAME not configured");
    expect(send).not.toHaveBeenCalled();
  });

  it("throws when the secret value is empty", async () => {
    process.env.CLERK_SECRET_NAME = "clerk/secret";
    send.mockResolvedValue({ SecretString: undefined });
    const { getClerkSecret } = await import("../src/utils");

    await expect(getClerkSecret()).rejects.toThrow("Secret value is empty");
  });

  it("fetches the secret once and caches it on subsequent calls", async () => {
    process.env.CLERK_SECRET_NAME = "clerk/secret";
    send.mockResolvedValue({ SecretString: "sk_live_abc" });
    const { getClerkSecret } = await import("../src/utils");

    expect(await getClerkSecret()).toBe("sk_live_abc");
    expect(await getClerkSecret()).toBe("sk_live_abc");
    expect(send).toHaveBeenCalledOnce();
  });
});
