import { type ReactNode } from "react";

import { ClerkProvider } from "@clerk/nextjs";

import { clerkLocalesMap, defaultClerkLocal } from "./utils";

interface IAuthProvider {
  children: ReactNode;
  locale: string;
}
export const AuthProvider = ({ children, locale }: IAuthProvider) => (
  <ClerkProvider
    localization={clerkLocalesMap[locale] ?? defaultClerkLocal}
    appearance={{ variables: { colorPrimary: "oklch(52.7% 0.046 245.4)" } }}>
    {children}
  </ClerkProvider>
);
