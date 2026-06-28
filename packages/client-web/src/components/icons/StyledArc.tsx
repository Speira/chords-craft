import Image from "next/image";

export const StyledArc = () => (
  <>
    <Image src="/arc.svg" alt="home-header-image" fill objectFit="contain" className="dark:hidden" />
    <Image src="/arc-dark.svg" alt="home-header-image" fill objectFit="contain" className="hidden dark:block" />
  </>
);
