"use client";

import { useState } from "react";

import { useSignUp } from "@clerk/nextjs";

import { Button, Input, Link, Typography } from "~/components";
import K from "~/constants";
import { Logger } from "~/lib/logger";
import { type AppTranslation } from "~/lib/next-intl";
import { checkIsDarkMode, cn } from "~/lib/shadcn";

import { SignUpVerification } from "./SignUpVerification";
import { clerkLocalAdapter } from "./utils";

/** Signup */
export function SignUpPage(props: { locale: string }) {
  const { signUp } = useSignUp();
  const isDarkMode = checkIsDarkMode();
  const locale = clerkLocalAdapter(props.locale);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<AppTranslation | "">("");
  const [isLoading, setIsLoading] = useState(false);

  const [pendingVerification, setPendingVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("auth.error.passwordsDoNotMatch");
      return;
    }
    if (!signUp) return;
    try {
      const emailAddress = email;
      setIsLoading(true);
      await signUp.create({ emailAddress, password, firstName, lastName, locale });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setIsLoading(false);
      setPendingVerification(true);
    } catch (err) {
      setIsLoading(false);
      Logger.error("SignUpPage.handleSubmit", { err });
      setError("auth.error.signupFailed");
    }
  };

  const signUpWithGoogle = () => {
    signUp?.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/auth/callback",
      redirectUrlComplete: "/",
    });
  };

  if (pendingVerification) {
    return <SignUpVerification />;
  }

  return (
    <section className="flex flex-col items-center">
      <div className="w-full max-w-md space-y-4 p-6">
        <Typography as="h3" className="text-2xl font-bold" label="auth.signupTitle" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="auth.firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
            />
            <Input
              placeholder="auth.lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Input
            type="email"
            placeholder="auth.email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <Input
            type="password"
            placeholder="auth.password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <Input
            type="password"
            placeholder="auth.confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          {error && <p className="text-destructive text-sm">{error}</p>}

          <div
            id="clerk-captcha"
            data-cl-language={locale}
            data-cl-theme={isDarkMode ? "dark" : "light"}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            label="auth.signup"
          />
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
          onClick={signUpWithGoogle}
          variant="outline"
          className="w-full"
          label="auth.signUpGoogle"
          disabled={isLoading}
          startNode={
            <img height="16" width="16" src="/google-logo.svg" alt="google-logo" />
          }
        />
        <div className={cn("flex gap-3 text-center text-sm", { invisible: isLoading })}>
          <Typography
            as="span"
            label="auth.hasAccount"
            className="text-muted-foreground"
          />
          <Link
            href={K.PATHS.LOGIN}
            className="text-primary hover:underline"
            label="auth.signIn"
          />
        </div>
      </div>
    </section>
  );
}
