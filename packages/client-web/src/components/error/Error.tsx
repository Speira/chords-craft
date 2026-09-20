'use client';
import { LinkButton } from '#client-web/components/Link';
import { Main } from '#client-web/components/Main';
import { Typography } from '#client-web/components/Typography';
import { Button } from '#client-web/components/ui/button';
import K from '#client-web/constants';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function Error({ error, reset }: ErrorProps) {
  return (
    <Main>
      <Typography isServer as="h1" className="text-6xl font-bold text-destructive">
        500
      </Typography>
      <Typography
        isServer
        as="h2"
        className="mt-4 text-2xl font-semibold text-foreground"
        label="error.serverError"
      />
      <Typography
        isServer
        as="p"
        className="mt-2 text-center text-muted-foreground"
        label="error.serverErrorDescription"
      />
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 max-w-2xl overflow-auto rounded-md bg-muted p-4 text-xs">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-4">
        <Button onClick={reset} variant="default">
          <Typography as="span" label="error.tryAgain" />
        </Button>
        <LinkButton isServer href={K.PATHS.HOME} variant="secondary" label="general.back" />
      </div>
    </Main>
  );
}
