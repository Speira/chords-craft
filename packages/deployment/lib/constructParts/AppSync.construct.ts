import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import type * as cognito from "aws-cdk-lib/aws-cognito";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export interface AppSyncApiProps {
  readonly chartFunction: lambda.IFunction;
  readonly userPool?: cognito.IUserPool;
}

export class AppSynConstruct extends Construct {
  public readonly graphqlApi: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncApiProps) {
    super(scope, id);

    // Resolve the schema file path from the schema package
    const schemaPackagePath = dirname(
      fileURLToPath(require.resolve("@speira/chordschart-context-chart"))
    );
    const schemaFilePath = join(schemaPackagePath, "graphql/schema.graphql");

    // AppSync GraphQL API with Cognito authentication
    const authConfig: appsync.AuthorizationConfig = props.userPool
      ? {
          defaultAuthorization: {
            authorizationType: appsync.AuthorizationType.USER_POOL,
            userPoolConfig: {
              userPool: props.userPool,
            },
          },
          // Secondary auth: API Key (for testing/development)
          additionalAuthorizationModes: [
            {
              authorizationType: appsync.AuthorizationType.API_KEY,
              apiKeyConfig: {
                expires: cdk.Expiration.after(cdk.Duration.days(365)),
              },
            },
          ],
        }
      : {
          // Fallback to API Key only if no user pool
          defaultAuthorization: {
            authorizationType: appsync.AuthorizationType.API_KEY,
          },
        };

    this.graphqlApi = new appsync.GraphqlApi(this, "ChordsChart", {
      name: "ChordsChart GraphQL API",
      definition: appsync.Definition.fromFile(schemaFilePath),
      authorizationConfig: authConfig,
      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        retention: logs.RetentionDays.ONE_WEEK,
      },
    });
  }
}
