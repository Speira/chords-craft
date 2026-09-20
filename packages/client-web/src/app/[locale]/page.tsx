import { ArrowRight } from 'lucide-react';

import { LinkButton, Main, Typography } from '#client-web/components';
import { StyledArc } from '#client-web/components/icons/StyledArc';
import K from '#client-web/constants';

export default async function Home() {
  return (
    <Main className="flex flex-col items-center">
      <Typography isServer as="h1" className="mb-0 text-5xl text-primary" label="general.title" />
      <div className="relative h-16 max-h-1/3 w-dvw max-w-3xl">
        <StyledArc />
      </div>
      <Typography isServer className="text-primary" as="strong" label="home.subtitle" />
      <div>
        <LinkButton isServer href={K.PATHS.CHARTS} size="lg">
          <Typography isServer label="chart.create" />
          <ArrowRight />
        </LinkButton>
      </div>
    </Main>
  );
}
