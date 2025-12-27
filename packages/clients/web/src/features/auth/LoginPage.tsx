"use client";

import { useState } from "react";

import { useSignIn } from "@clerk/nextjs";

import { Button, Input, Link, Skeleton, Typography } from "~/components";
import K from "~/constants";
import { Logger } from "~/lib/logger";
import { type AppTranslation, useRouter } from "~/lib/next-intl";
import { useAppTranslations } from "~/lib/next-intl/useAppTranslation";
import { checkIsDarkMode, cn } from "~/lib/shadcn";

import { clerkLocalAdapter, getClerkError } from "./utils";

export function LoginPage(props: { locale: string }) {
  const locale = clerkLocalAdapter(props.locale);
  const isDarkMode = checkIsDarkMode();
  const router = useRouter();
  const t = useAppTranslations();
  const { setActive, signIn } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AppTranslation | "">("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!signIn || isLoading) return;
    try {
      setIsLoading(true);
      const result = await signIn.create({ identifier: email });
      if (result.status === "needs_first_factor") {
        const attemptFirstFactor = await signIn.attemptFirstFactor({
          strategy: "password",
          password,
        });
        if (attemptFirstFactor.status === "complete") {
          await setActive({ session: attemptFirstFactor.createdSessionId });
          router.push("/");
        } else {
          Logger.warn("LoginPage.handleSubmit", { attemptFirstFactor });
        }
      }
      if (isLoading) setIsLoading(false);
    } catch (err) {
      Logger.error("SignUpPage.handleSubmit", { err });
      setIsLoading(false);
      const code = getClerkError(err);
      if (t.has(code)) setError(code as AppTranslation);
      else setError("auth.error.invalidCredentials");
    }
  };

  const signInWithGoogle = () => {
    setIsLoading(true);
    signIn
      ?.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/callback",
        redirectUrlComplete: "/",
      })
      .catch((err) => {
        Logger.error("LoginPage.signInWithGoogle", { err });
        setError("auth.error.googleAuthError");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <section className="flex flex-col items-center">
      <div className="w-full max-w-md space-y-4 p-6">
        <Typography as="h3" className="text-2xl font-bold" label="auth.login" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="auth.email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input
            type="password"
            placeholder="auth.password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          {error && <Typography className="text-destructive text-sm" label={error} />}

          <div
            id="clerk-captcha"
            data-cl-language={locale}
            data-cl-theme={isDarkMode ? "dark" : "light"}
          />
          {isLoading ? (
            <Skeleton />
          ) : (
            <Button type="submit" className="w-full" label="auth.signIn" />
          )}
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <Typography
              as="span"
              className="bg-background px-2 text-muted-foreground"
              label="general.or"
            />
          </div>
        </div>

        <Button
          onClick={signInWithGoogle}
          variant="outline"
          className="w-full"
          label="auth.signInGoogle"
          disabled={isLoading}
          startNode={
            <img height="16" width="16" src="/google-logo.svg" alt="google-logo" />
          }
        />

        <div className={cn("flex gap-3 text-center text-sm", { invisible: isLoading })}>
          <Typography
            as="span"
            label="auth.hasNoAccount"
            className="text-muted-foreground"
          />{" "}
          <Link
            href={K.PATHS.SIGNUP}
            className="text-primary hover:underline"
            label="auth.signup"
          />
        </div>
      </div>
    </section>
  );
}
