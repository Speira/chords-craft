import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export interface CognitoAuthProps {
  readonly stackName: string;
  readonly callbackUrls?: Array<string>;
  readonly logoutUrls?: Array<string>;
  readonly googleClientId?: string;
  readonly googleClientSecret?: string;
  readonly isProduction: boolean;
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, props: CognitoAuthProps) {
    super(scope, id);

    // User Pool with social sign-in support
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `${props.stackName}-users`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
        profilePicture: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        role: new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 20,
        }),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Retain users even if stack is deleted
      deletionProtection: false, // Set to true for production
    });

    let googleClientSecretValue: cdk.SecretValue | undefined;

    if (props.googleClientSecret) {
      if (props.isProduction) {
        // PRODUCTION: Retrieve secret securely from Secrets Manager
        // NOTE: Must have previously stored the secret under this name.
        googleClientSecretValue = cdk.SecretValue.secretsManager(
          `${props.stackName}/google-client-secret`
        );
      } else {
        // DEVELOPMENT: Use plaintext value passed via environment variables
        googleClientSecretValue = cdk.SecretValue.unsafePlainText(
          props.googleClientSecret
        );
      }
    }

    let googleProvider: cognito.UserPoolIdentityProviderGoogle | undefined;

    if (props.googleClientId && googleClientSecretValue) {
      // Check if we have a resolved secret value
      googleProvider = new cognito.UserPoolIdentityProviderGoogle(
        this,
        "GoogleProvider",
        {
          clientId: props.googleClientId,
          // Use the resolved SecretValue here
          clientSecretValue: googleClientSecretValue,
          userPool: this.userPool,
          scopes: ["email", "profile", "openid"],
          attributeMapping: {
            email: cognito.ProviderAttribute.GOOGLE_EMAIL,
            givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
            familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
            profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
          },
        }
      );
    }

    // Cognito Hosted UI Domain (required for social sign-in)
    // Note: Domain prefix must be globally unique across all AWS accounts
    const domainPrefix = `${props.stackName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")}-${cdk.Stack.of(this).account.substring(
      0,
      8
    )}`;

    this.userPoolDomain = this.userPool.addDomain("CognitoDomain", {
      cognitoDomain: {
        domainPrefix,
      },
    });

    // Supported identity providers list
    const supportedProviders = [cognito.UserPoolClientIdentityProvider.COGNITO];

    if (googleProvider) {
      supportedProviders.push(cognito.UserPoolClientIdentityProvider.GOOGLE);
    }

    // User Pool Client with OAuth support
    this.userPoolClient = this.userPool.addClient("WebClient", {
      authFlows: {
        userPassword: true, // Email/password authentication
        userSrp: true, // Secure Remote Password (recommended)
        custom: true, // Custom authentication flows
      },
      generateSecret: false, // Must be false for web/mobile apps
      preventUserExistenceErrors: true, // Security best practice

      // OAuth configuration for social sign-in
      oAuth: {
        flows: {
          authorizationCodeGrant: true, // Required for social sign-in
          implicitCodeGrant: false, // Less secure, disabled
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: props.callbackUrls || [
          "http://localhost:3000/auth/callback",
          "http://localhost:5173/auth/callback", // Vite default port
        ],
        logoutUrls: props.logoutUrls || [
          "http://localhost:3000",
          "http://localhost:5173",
        ],
      },

      // Link to social providers
      supportedIdentityProviders: supportedProviders,

      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Ensure Google provider is created before client (if exists)
    if (googleProvider) {
      this.userPoolClient.node.addDependency(googleProvider);
    }

    // User Groups for RBAC
    new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "ADMIN",
      description: "Administrators with full access",
      precedence: 1,
    });

    new cognito.CfnUserPoolGroup(this, "ManagerGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "MANAGER",
      description: "Managers with elevated permissions",
      precedence: 2,
    });

    // Outputs
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID",
      exportName: `${props.stackName}-user-pool-id`,
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
      exportName: `${props.stackName}-user-pool-client-id`,
    });

    new cdk.CfnOutput(this, "UserPoolArn", {
      value: this.userPool.userPoolArn,
      description: "Cognito User Pool ARN",
      exportName: `${props.stackName}-user-pool-arn`,
    });

    new cdk.CfnOutput(this, "CognitoDomain", {
      value: `https://${domainPrefix}.auth.${
        cdk.Stack.of(this).region
      }.amazoncognito.com`,
      description: "Cognito Hosted UI Domain",
      exportName: `${props.stackName}-cognito-domain`,
    });

    new cdk.CfnOutput(this, "CognitoRegion", {
      value: cdk.Stack.of(this).region,
      description: "AWS Region for Cognito",
      exportName: `${props.stackName}-cognito-region`,
    });
  }
}
