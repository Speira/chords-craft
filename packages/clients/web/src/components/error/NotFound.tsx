import K from "~/constants";

import { LinkButton } from "../Link";
import { Main } from "../Main";
import { Typography } from "../Typography";

export async function NotFound() {
  return (
    <Main>
      <Typography as="h1" className="text-foreground text-6xl font-bold">
        404
      </Typography>
      <Typography
        as="h2"
        className="mt-4 text-2xl font-semibold"
        label="error.notFound"
      />
      <Typography
        as="p"
        className="text-muted-foreground mt-2"
        label="error.notFoundDescription"
      />
      <br />
      <LinkButton href={K.PATHS.HOME} variant="default" label="general.back" />
    </Main>
  );
}
