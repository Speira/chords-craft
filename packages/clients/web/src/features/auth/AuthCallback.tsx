"use client";

import { useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { oauth } from "~/lib/aws-cognito";

import * as authStorage from "./storage";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      router.push("/login?error=no_code");
      return;
    }

    oauth
      .exchangeCodeForTokens(code)
      .then((tokens) => {
        authStorage.setTokens(tokens.access_token, tokens.id_token, tokens.refresh_token);
        router.push("/");
      })
      .catch((error) => {
        console.error("OAuth callback error:", error);
        router.push("/login?error=oauth_failed");
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Signing you in...</p>
    </div>
  );
}
