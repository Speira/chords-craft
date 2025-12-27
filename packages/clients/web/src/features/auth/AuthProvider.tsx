import { type ReactNode } from "react";

import { ClerkProvider } from "@clerk/nextjs";

import { clerkLocalesMap, defaultClerkLocal } from "./utils";

export const AuthProvider = ({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) => (
  <ClerkProvider
    localization={clerkLocalesMap[locale] ?? defaultClerkLocal}
    appearance={{ variables: { colorPrimary: "oklch(52.7% 0.046 245.4)" } }}>
    {children}
  </ClerkProvider>
);
