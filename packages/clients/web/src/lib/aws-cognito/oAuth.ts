import { cognitoConfig } from "./config";

export const oauth = {
  getGoogleSignInUrl() {
    const params = new URLSearchParams({
      client_id: cognitoConfig.clientId,
      response_type: "code",
      scope: "email openid profile",
      redirect_uri: cognitoConfig.redirectSignIn,
      identity_provider: "Google",
    });

    return `${cognitoConfig.domain}/oauth2/authorize?${params.toString()}`;
  },

  getSignOutUrl() {
    const params = new URLSearchParams({
      client_id: cognitoConfig.clientId,
      logout_uri: cognitoConfig.redirectSignOut,
    });

    return `${cognitoConfig.domain}/logout?${params.toString()}`;
  },

  /** Exchange authorization code for tokens */
  async exchangeCodeForTokens(code: string) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: cognitoConfig.clientId,
      code,
      redirect_uri: cognitoConfig.redirectSignIn,
    });

    const response = await fetch(`${cognitoConfig.domain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    return await response.json();
  },
};
