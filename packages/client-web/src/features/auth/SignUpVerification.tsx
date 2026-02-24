"use client";

import { useState } from "react";

import { useSignUp } from "@clerk/nextjs";

import { Button, Input, Skeleton, Typography } from "~/components";
import { Logger } from "~/lib/logger";
import { type AppTranslation, useRouter } from "~/lib/next-intl";

export function SignUpVerification() {
  const [error, setError] = useState<AppTranslation | "">("");
  const { setActive, signUp } = useSignUp();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!signUp) return;
    try {
      setIsLoading(true);
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        setIsLoading(false);
        router.push("/");
      }
      if (isLoading) setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      Logger.error("SignUpVerification.handleVerification", { err });
      setError("auth.error.verificationFailed");
    }
  };

  return (
    <section className="flex flex-col items-center">
      <div className="w-full max-w-md space-y-4 p-6">
        <Typography as="h3" className="text-2xl font-bold" label="auth.verifyEmail" />
        <Typography
          as="p"
          className="text-sm text-muted-foreground"
          label="auth.verificationCodeSent"
        />
        <form onSubmit={handleVerification} className="space-y-4">
          <Input
            type="text"
            placeholder="auth.verificationCode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            disabled={isLoading}
          />
          {error && <Typography className="text-destructive text-sm" label={error} />}
          {isLoading ? (
            <Skeleton />
          ) : (
            <Button type="submit" className="w-full" label="auth.verify" />
          )}
        </form>
      </div>
    </section>
  );
}
