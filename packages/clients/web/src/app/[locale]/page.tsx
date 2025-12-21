import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { LinkButton, Main, Typography } from "~/components";
import K from "~/constants";

export default async function Home() {
  return (
    <Main className="flex flex-col items-center">
      <Typography as="h1" className="text-primary text-5xl mb-0" label="general.title" />
      <div className="relative h-16 max-h-1/3 w-dvw max-w-3xl">
        <Image src="/arc.svg" alt="home-header-image" priority fill objectFit="contain" />
      </div>
      <Typography className="text-primary" as="strong" label="home.subtitle" />
      <div>
        <LinkButton href={K.PATHS.CHARTS} size="lg">
          <Typography label="chart.create" />
          <ArrowRight />
        </LinkButton>
      </div>
    </Main>
  );
}
