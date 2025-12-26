"use client";

import { useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import K from "~/constants";
import { oauth } from "~/lib/aws-cognito";
import { Logger } from "~/lib/logger";

import * as authStorage from "./storage";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    Logger.error("AuthCallback");
    if (error === "access_denied") {
      router.push(`${K.PATHS.LOGIN}?error=cancelled`);
      return;
    }

    if (error) {
      Logger.error("OAuth error:", error, errorDescription);
      router.push(`${K.PATHS.LOGIN}?error=${error}`);
      return;
    }

    if (!code) {
      router.push(`${K.PATHS.LOGIN}?error=no_code`);
      return;
    }

    oauth
      .exchangeCodeForTokens(code)
      .then((tokens) => {
        authStorage.setTokens(tokens.access_token, tokens.id_token, tokens.refresh_token);
        router.push("/");
      })
      .catch((error) => {
        Logger.error("Token exchange error:", error);
        router.push(`${K.PATHS.LOGIN}?error=oauth_failed`);
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Signing you in...</p>
    </div>
  );
}
