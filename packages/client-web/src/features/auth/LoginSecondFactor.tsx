'use client';

import { useState } from 'react';

import { useSignIn } from '@clerk/nextjs';

import { Button, Input, Skeleton, Typography } from '#client-web/components';
import { Logger } from '#client-web/lib/logger';
import { type AppTranslation, useRouter } from '#client-web/lib/nextIntl';
import { useAppTranslations } from '#client-web/lib/nextIntl/useAppTranslation';

import { describeAuthError, getClerkError, type SecondFactorStrategy } from './utils';

interface LoginSecondFactorProps {
  /** Resolved from `signIn.supportedSecondFactors` when the first factor completed. */
  strategy: SecondFactorStrategy;
}

const PROMPTS: Record<SecondFactorStrategy, AppTranslation> = {
  totp: 'auth.twoFactor.totpPrompt',
  phone_code: 'auth.twoFactor.phoneCodePrompt',
  email_code: 'auth.twoFactor.emailCodePrompt',
  backup_code: 'auth.twoFactor.backupCodePrompt',
};

/** Second step of the sign-in flow, shown when Clerk answers `needs_second_factor`. */
export function LoginSecondFactor({ strategy }: LoginSecondFactorProps) {
  const router = useRouter();
  const t = useAppTranslations();
  const { setActive, signIn } = useSignIn();
  const [code, setCode] = useState('');
  const [error, setError] = useState<AppTranslation | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!signIn || isLoading) return;
    try {
      setIsLoading(true);
      const attempt = await signIn.attemptSecondFactor({ strategy, code });
      if (attempt.status !== 'complete') {
        Logger.warn('LoginSecondFactor.handleSubmit', { status: attempt.status });
        setError('auth.error.secondFactorFailed');
        return;
      }
      await setActive({ session: attempt.createdSessionId });
      router.push('/');
    } catch (err) {
      Logger.error('LoginSecondFactor.handleSubmit', describeAuthError(err));
      const clerkCode = getClerkError(err);
      if (t.has(clerkCode)) setError(clerkCode as AppTranslation);
      else setError('auth.error.secondFactorFailed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center">
      <div className="w-full max-w-md space-y-4 p-6">
        <Typography as="h3" className="text-2xl font-bold" label="auth.twoFactor.title" />
        <Typography as="p" className="text-sm text-muted-foreground" label={PROMPTS[strategy]} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            inputMode={strategy === 'backup_code' ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            placeholder="auth.twoFactor.code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            disabled={isLoading}
          />
          {error && <Typography className="text-sm text-destructive" label={error} />}
          {isLoading ? (
            <Skeleton />
          ) : (
            <Button type="submit" className="w-full" label="auth.twoFactor.verify" />
          )}
        </form>
      </div>
    </section>
  );
}
