import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import path from "path";

import K from "../constants";

export interface AppSyncApiProps {
  readonly chartFunction: lambda.IFunction;
  readonly authorizerFunction: lambda.IFunction;
}

export class AppSynConstruct extends Construct {
  public readonly graphqlApi: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncApiProps) {
    super(scope, id);

    // File Automatically generated on build/synth command
    const schemaFilePath = path.join(__dirname, `../${K.PATHS_FROM_SRC.GRAPHQL_SCHEMAS}`);

    const authConfig: appsync.AuthorizationConfig = {
      defaultAuthorization: {
        authorizationType: appsync.AuthorizationType.LAMBDA,
        lambdaAuthorizerConfig: {
          handler: props.authorizerFunction,
          resultsCacheTtl: cdk.Duration.minutes(5),
        },
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
