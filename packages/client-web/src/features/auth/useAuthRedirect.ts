'use client';

import { useRef, useState } from 'react';

import { useRouter } from '#client-web/lib/nextIntl';

/**
 * Keeps the pending UI up while the router navigates.
 *
 * `router.push` resolves as soon as the navigation starts, so a handler that resets its loading
 * flag afterwards puts the form back on screen — stale inputs and all — until the next screen
 * paints. `checkIsRedirecting` reads a ref, so it is safe inside a `finally` where state from the
 * current render is already out of date.
 *
 * @example
 *   const { isRedirecting, redirectTo, checkIsRedirecting } = useAuthRedirect();
 *   // ...
 *   finally {
 *   if (!checkIsRedirecting()) setIsLoading(false);
 *   }
 */
export function useAuthRedirect() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectingRef = useRef(false);

  const redirectTo = (path: string) => {
    redirectingRef.current = true;
    setIsRedirecting(true);
    router.push(path);
  };

  const checkIsRedirecting = () => redirectingRef.current;

  return { checkIsRedirecting, isRedirecting, redirectTo };
}
