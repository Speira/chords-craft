import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

import K from '#client-web/constants';

import { clerkLocalesMap, defaultClerkLocal } from './utils';

interface AuthProviderProps {
  children: ReactNode;
  locale: string;
}
export const AuthProvider = ({ children, locale }: AuthProviderProps) => (
  <ClerkProvider
    localization={clerkLocalesMap[locale] ?? defaultClerkLocal}
    appearance={{ variables: { colorPrimary: K.BRAND.PRIMARY } }}>
    {children}
  </ClerkProvider>
);
