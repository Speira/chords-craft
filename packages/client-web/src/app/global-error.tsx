'use client';
import { GlobalError as GlobalErrorView } from '#client-web/components';

import './[locale]/globals.css';

/**
 * Last-resort boundary: it replaces the root layout when the layout itself fails, so it has to
 * carry its own `html` and `body`, and nothing below it can rely on a provider.
 */
export default function GlobalErrorBoundary(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <GlobalErrorView {...props} />
      </body>
    </html>
  );
}
