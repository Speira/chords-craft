"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { CognitoIdentityProviderServiceException } from "@aws-sdk/client-cognito-identity-provider";

import { cognitoClient, oauth } from "~/lib/aws-cognito";
import { Logger } from "~/lib/logger";
import { type HandledResponse } from "~/types";

import * as authStorage from "./storage";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (params: {
    email: string;
    password: string;
    givenName?: string;
    familyName?: string;
  }) => Promise<HandledResponse>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<HandledResponse>;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(authStorage.hasValidTokens());
    setIsLoading(false);
  }, []);

  const signUp = async (params: {
    email: string;
    password: string;
    givenName?: string;
    familyName?: string;
  }) => {
    await cognitoClient.signUp(params);
  };

  const confirmSignUp = async (email: string, code: string) => {
    await cognitoClient.confirmSignUp(email, code);
  };

  const signIn = async (email: string, password: string): Promise<HandledResponse> => {
    try {
      const tokens = await cognitoClient.signIn({ email, password });
      authStorage.setTokens(tokens.accessToken, tokens.idToken, tokens.refreshToken);
      setIsAuthenticated(true);
      return [null, null];
    } catch (err) {
      Logger.error("AuthProvider.signin:", err);
      if (err instanceof CognitoIdentityProviderServiceException) {
        if (err.name === "ResourceNotFoundException") {
          return ["auth.error.userNotFound", null];
        }
      }
      return ["auth.error.invalidCredentials", null];
    }
  };

  const signInWithGoogle = () => {
    window.location.href = oauth.getGoogleSignInUrl();
  };

  const signOut = async () => {
    const accessToken = authStorage.getAccessToken();
    if (accessToken) {
      try {
        await cognitoClient.signOut(accessToken);
      } catch (error) {
        Logger.error("Sign out error:", error);
      }
    }
    authStorage.clearTokens();
    setIsAuthenticated(false);
  };

  const forgotPassword = async (email: string) => {
    await cognitoClient.forgotPassword(email);
  };

  const confirmForgotPassword = async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    await cognitoClient.confirmForgotPassword(email, code, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        signUp,
        confirmSignUp,
        signIn,
        signInWithGoogle,
        signOut,
        forgotPassword,
        confirmForgotPassword,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
