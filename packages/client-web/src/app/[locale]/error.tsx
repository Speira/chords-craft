'use client';
import { Error as ErrorView } from '#client-web/components';

/**
 * Route-level error boundary for every page under `[locale]`. It renders inside the locale layout,
 * so the i18n and theme providers are mounted and the copy is translated.
 */
export default function ErrorBoundary(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorView {...props} />;
}
