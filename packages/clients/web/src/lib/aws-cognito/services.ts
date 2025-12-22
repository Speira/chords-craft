import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  GlobalSignOutCommand,
  InitiateAuthCommand,
  type InitiateAuthCommandInput,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { cognitoConfig } from "./config";

const client = new CognitoIdentityProviderClient({
  region: cognitoConfig.region,
});

export interface SignUpParams {
  email: string;
  password: string;
  givenName?: string;
  familyName?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface TokenResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export const cognitoClient = {
  async signUp({ email, familyName, givenName, password }: SignUpParams) {
    const command = new SignUpCommand({
      ClientId: cognitoConfig.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        ...(givenName ? [{ Name: "given_name", Value: givenName }] : []),
        ...(familyName ? [{ Name: "family_name", Value: familyName }] : []),
      ],
    });

    const response = await client.send(command);
    return {
      userSub: response.UserSub!,
      userConfirmed: response.UserConfirmed,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    };
  },

  async confirmSignUp(email: string, code: string) {
    const command = new ConfirmSignUpCommand({
      ClientId: cognitoConfig.clientId,
      Username: email,
      ConfirmationCode: code,
    });

    await client.send(command);
  },

  /** Sign in with email/password */
  async signIn({ email, password }: SignInParams): Promise<TokenResult> {
    const params: InitiateAuthCommandInput = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: cognitoConfig.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const command = new InitiateAuthCommand(params);
    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      throw new Error("Authentication failed");
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken: response.AuthenticationResult.RefreshToken!,
    };
  },

  /** Refresh tokens */
  async refreshTokens(refreshToken: string): Promise<TokenResult> {
    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: cognitoConfig.clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      throw new Error("Token refresh failed");
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken,
    };
  },

  /** Forgot password - send verification code */
  async forgotPassword(email: string) {
    const command = new ForgotPasswordCommand({
      ClientId: cognitoConfig.clientId,
      Username: email,
    });

    const response = await client.send(command);
    return response.CodeDeliveryDetails;
  },

  /** Confirm forgot password with code */
  async confirmForgotPassword(email: string, code: string, newPassword: string) {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: cognitoConfig.clientId,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await client.send(command);
  },

  /** Sign out (invalidate all tokens) */
  async signOut(accessToken: string) {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await client.send(command);
  },
};
