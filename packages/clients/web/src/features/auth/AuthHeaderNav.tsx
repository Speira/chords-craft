"use client";
import { type PropsWithChildren } from "react";

import { LinkButton, Skeleton } from "~/components";
import K from "~/constants";

import { useAuth } from "./AuthProvider";

const AuthNavDiv = ({ children }: PropsWithChildren) => <div>{children}</div>;

export function AuthHeaderNav() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AuthNavDiv>
        <Skeleton className="w-12" />
      </AuthNavDiv>
    );
  }

  if (isAuthenticated) {
    return <LinkButton href={K.PATHS.LOGOUT} label="auth.logout" />;
  }

  return <LinkButton href={K.PATHS.LOGIN} label="auth.login" />;
}
