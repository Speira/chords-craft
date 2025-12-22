"use client";
import K from "~/constants";

import { LinkButton } from "../Link";
import { Main } from "../Main";
import { Typography } from "../Typography";
import { Button } from "../ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function Error({ error, reset }: ErrorProps) {
  return (
    <Main>
      <Typography isServer as="h1" className="text-destructive text-6xl font-bold">
        500
      </Typography>
      <Typography
        isServer
        as="h2"
        className="text-foreground mt-4 text-2xl font-semibold"
        label="error.serverError"
      />
      <Typography
        isServer
        as="p"
        className="text-muted-foreground mt-2 text-center"
        label="error.serverErrorDescription"
      />
      {process.env.NODE_ENV === "development" && (
        <pre className="bg-muted mt-4 max-w-2xl overflow-auto rounded-md p-4 text-xs">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-4">
        <Button onClick={reset} variant="default">
          <Typography as="span" label="error.tryAgain" />
        </Button>
        <LinkButton
          isServer
          href={K.PATHS.HOME}
          variant="secondary"
          label="general.back"
        />
      </div>
    </Main>
  );
}
