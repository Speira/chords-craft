import Image from "next/image";

import { Main, Typography } from "~/components";

export default async function Home() {
  return (
    <Main>
      <div className="flex flex-col items-center">
        <Typography
          as="h1"
          className="text-primary text-5xl mb-0 font-alpha"
          label="general.title"
        />
        <div className="relative h-16 max-h-1/3 w-dvw max-w-3xl">
          <Image
            src="/arc.svg"
            alt="home-header-image"
            priority
            fill
            objectFit="contain"
          />
        </div>
      </div>
    </Main>
  );
}
