import { Logger } from "~/lib/logger";

export function GlobalError({
  error,
  reset,
}: {
  reset: () => void;
  error: Error & { digest?: string };
}) {
  Logger.error(error);
  return (
    <div className="flex min-h-screen w-dvw flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-red-300">500</h1>
      <h2 className="mt-4 text-2xl font-semibold">Something went wrong!</h2>
      <p className="mt-2 text-center text-gray-600">
        A critical error occurred. Please try refreshing the page.
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Try again
        </button>
      </div>
    </div>
  );
}
