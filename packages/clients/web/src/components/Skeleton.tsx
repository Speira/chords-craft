import { Skeleton as BaseSkeleton } from "./ui/skeleton";

export const Skeleton = (props: React.ComponentProps<"div">) => (
  <BaseSkeleton className="min-h-8 w-full" {...props} />
);
