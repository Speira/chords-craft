'use client';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
} from '@clerk/nextjs';
import { LogInIcon, LogOutIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { Button } from '#client-web/components';

const AuthNavDiv = ({ children }: PropsWithChildren) => <div>{children}</div>;

export function AuthHeaderNav() {
  const { isSignedIn } = useAuth();
  return (
    <AuthNavDiv>
      <SignedOut>
        {isSignedIn ? (
          <SignUpButton>
            <Button endNode={<LogOutIcon />} label="auth.signOut" />
          </SignUpButton>
        ) : (
          <SignInButton>
            <Button endNode={<LogInIcon />} label="auth.signIn" />
          </SignInButton>
        )}
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </AuthNavDiv>
  );
}
