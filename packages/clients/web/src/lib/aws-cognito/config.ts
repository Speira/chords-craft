export const cognitoConfig = {
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
  clientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
  region: process.env.NEXT_PUBLIC_COGNITO_REGION || "eu-west-3",
  redirectSignIn:
    process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || "http://localhost:3000/auth/callback",
  redirectSignOut: process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || "http://localhost:3000",
} as const;
