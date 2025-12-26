"use client";
import { type PropsWithChildren } from "react";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { Button } from "~/components";

const AuthNavDiv = ({ children }: PropsWithChildren) => <div>{children}</div>;

export function AuthHeaderNav() {
  return (
    <AuthNavDiv>
      <SignedOut>
        <SignInButton />
        <SignUpButton>
          <Button label="auth.signOut" />
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </AuthNavDiv>
  );
}
