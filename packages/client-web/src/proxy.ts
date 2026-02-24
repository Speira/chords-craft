import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "~/lib/next-intl";

const localePattern = `(${routing.locales.join("|")})`;

const intlMiddleware = createMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  "/",
  `/:locale${localePattern}?`,
  `/:locale${localePattern}?/auth/login`,
  `/:locale${localePattern}?/auth/sign-up`,
  `/:locale${localePattern}?/auth/callback`,
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  return intlMiddleware(req);
});
export const config = {
  matcher: ["/", "/((?!api|_next|_vercel|trpc|\\.well-known|.*\\..*).*)"],
};
