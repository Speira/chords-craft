import { LinkButton } from '#client-web/components/Link';
import { Main } from '#client-web/components/Main';
import { Typography } from '#client-web/components/Typography';
import K from '#client-web/constants';

export async function NotFound() {
  return (
    <Main>
      <Typography isServer as="h1" className="text-6xl font-bold text-foreground">
        404
      </Typography>
      <Typography isServer as="h2" className="mt-4 text-2xl font-semibold" label="error.notFound" />
      <Typography
        isServer
        as="p"
        className="mt-2 text-muted-foreground"
        label="error.notFoundDescription"
      />
      <br />
      <LinkButton isServer href={K.PATHS.HOME} variant="default" label="general.back" />
    </Main>
  );
}
