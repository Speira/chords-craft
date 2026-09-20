'use client';

import { useState } from 'react';

import { useSignUp } from '@clerk/nextjs';

import { Button, Input, Loader, Skeleton, Typography } from '#client-web/components';
import { Logger } from '#client-web/lib/logger';
import type { AppTranslation } from '#client-web/lib/nextIntl';

import { useAuthRedirect } from './useAuthRedirect';
import { describeAuthError } from './utils';

export function SignUpVerification() {
  const [error, setError] = useState<AppTranslation | ''>('');
  const { setActive, signUp } = useSignUp();
  const { checkIsRedirecting, isRedirecting, redirectTo } = useAuthRedirect();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!signUp) return;
    try {
      setIsLoading(true);
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      // An incomplete verification used to end here in silence, with the form still disabled.
      if (completeSignUp.status !== 'complete') {
        Logger.warn('SignUpVerification.handleVerification', { status: completeSignUp.status });
        setError('auth.error.verificationFailed');
        return;
      }
      await setActive({ session: completeSignUp.createdSessionId });
      redirectTo('/');
    } catch (err) {
      Logger.error('SignUpVerification.handleVerification', describeAuthError(err));
      setError('auth.error.verificationFailed');
    } finally {
      if (!checkIsRedirecting()) setIsLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <section className="flex flex-col items-center gap-4 p-6">
        <Loader />
        <Typography as="p" className="text-sm text-muted-foreground" label="auth.signingIn" />
      </section>
    );
  }

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
          {error && <Typography className="text-sm text-destructive" label={error} />}
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
