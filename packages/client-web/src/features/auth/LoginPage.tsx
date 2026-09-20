'use client';

import { useState } from 'react';

import { useSignIn } from '@clerk/nextjs';

import { Button, Input, Link, Loader, Skeleton, Typography } from '#client-web/components';
import K from '#client-web/constants';
import { Logger } from '#client-web/lib/logger';
import type { AppTranslation } from '#client-web/lib/nextIntl';
import { useAppTranslations } from '#client-web/lib/nextIntl/useAppTranslation';
import { checkIsDarkMode, cn } from '#client-web/lib/shadcn';

import { LoginSecondFactor } from './LoginSecondFactor';
import { useAuthRedirect } from './useAuthRedirect';
import {
  checkIsSecondFactorStrategy,
  clerkLocalAdapter,
  describeAuthError,
  getClerkError,
  SECOND_FACTOR_STRATEGIES,
  type SecondFactorStrategy,
} from './utils';

export function LoginPage(props: { locale: string }) {
  const locale = clerkLocalAdapter(props.locale);
  const isDarkMode = checkIsDarkMode();
  const { checkIsRedirecting, isRedirecting, redirectTo } = useAuthRedirect();
  const t = useAppTranslations();
  const { setActive, signIn } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AppTranslation | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [secondFactor, setSecondFactor] = useState<SecondFactorStrategy | null>(null);

  /** Resolve and prepare the second factor Clerk is asking for. False when we cannot handle it. */
  const startSecondFactor = async () => {
    const strategy = SECOND_FACTOR_STRATEGIES.find((candidate) =>
      (signIn?.supportedSecondFactors ?? []).some((factor) => factor.strategy === candidate),
    );
    if (!checkIsSecondFactorStrategy(strategy)) {
      Logger.warn('LoginPage.startSecondFactor', {
        supportedSecondFactors: signIn?.supportedSecondFactors,
      });
      return false;
    }
    // TOTP and backup codes are entered straight away; a code has to be sent first.
    if (strategy === 'phone_code' || strategy === 'email_code') {
      await signIn?.prepareSecondFactor({ strategy });
    }
    setSecondFactor(strategy);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!signIn || isLoading) return;
    try {
      setIsLoading(true);
      const result = await signIn.create({ identifier: email });
      // Every outcome must either navigate or show why it did not: while isLoading is true the
      // inputs are disabled and the submit button is replaced by a skeleton, so a silent return
      // leaves the screen looking frozen.
      if (result.status === 'needs_second_factor') {
        if (!(await startSecondFactor())) setError('auth.error.secondFactorUnsupported');
        return;
      }
      if (result.status !== 'needs_first_factor') {
        Logger.warn('LoginPage.handleSubmit', { status: result.status });
        setError('auth.error.invalidCredentials');
        return;
      }
      const attemptFirstFactor = await signIn.attemptFirstFactor({
        strategy: 'password',
        password,
      });
      if (attemptFirstFactor.status === 'needs_second_factor') {
        // The account has 2FA on: ask for the factor Clerk offers instead of calling the
        // password wrong.
        if (!(await startSecondFactor())) setError('auth.error.secondFactorUnsupported');
        return;
      }
      if (attemptFirstFactor.status !== 'complete') {
        Logger.warn('LoginPage.handleSubmit', { status: attemptFirstFactor.status });
        setError('auth.error.invalidCredentials');
        return;
      }
      await setActive({ session: attemptFirstFactor.createdSessionId });
      redirectTo('/');
    } catch (err) {
      Logger.error('LoginPage.handleSubmit', describeAuthError(err));
      const code = getClerkError(err);
      if (t.has(code)) setError(code as AppTranslation);
      else setError('auth.error.invalidCredentials');
    } finally {
      // Comes back on every path except a navigation, where the pending UI must stay up.
      if (!checkIsRedirecting()) setIsLoading(false);
    }
  };

  const signInWithGoogle = () => {
    setIsLoading(true);
    signIn
      ?.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/auth/callback',
        redirectUrlComplete: '/',
      })
      .catch((err) => {
        Logger.error('LoginPage.signInWithGoogle', describeAuthError(err));
        setError('auth.error.googleAuthError');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (isRedirecting) {
    return (
      <section className="flex flex-col items-center gap-4 p-6">
        <Loader />
        <Typography as="p" className="text-sm text-muted-foreground" label="auth.signingIn" />
      </section>
    );
  }

  if (secondFactor) return <LoginSecondFactor strategy={secondFactor} />;

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
          {error && <Typography className="text-sm text-destructive" label={error} />}

          <div
            id="clerk-captcha"
            data-cl-language={locale}
            data-cl-theme={isDarkMode ? 'dark' : 'light'}
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
          startNode={<img height="16" width="16" src="/google-logo.svg" alt="google-logo" />}
        />

        <div className={cn('flex gap-3 text-center text-sm', { invisible: isLoading })}>
          <Typography as="span" label="auth.hasNoAccount" className="text-muted-foreground" />{' '}
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
