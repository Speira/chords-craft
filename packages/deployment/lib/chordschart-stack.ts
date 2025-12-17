import * as cdk from "aws-cdk-lib/core";
import { type Construct } from "constructs";

import {
  AppSynConstruct,
  CognitoConstruct,
  DatabaseConstruct,
  LambdasConstruct,
  MonitoringConstruct,
  NetworkingConstruct,
  SecurityConstruct,
  StorageConstruct,
} from "./constructParts";

export class ChordsChartStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const environment = this.node.tryGetContext("env") || "dev";
    const IS_PRODUCTION = environment === "prod";

    const removalPolicy = IS_PRODUCTION
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    const database = new DatabaseConstruct(this, "Database", {
      stackName: this.stackName,
      removalPolicy,
    });

    const networking = new NetworkingConstruct(this, "Networking", {
      maxAzs: 2,
      natGateways: 0,
    });

    const storage = new StorageConstruct(this, "Construct", {
      account: this.account,
      stackName: this.stackName,
      removalPolicy,
      autoDeleteObjects: !IS_PRODUCTION,
    });
    const cognito = new CognitoConstruct(this, "Cognito", {
      stackName: this.stackName,
      callbackUrls: [
        "http://localhost:3000/auth/callback",
        // Add production URLs here when deploying
      ],
      logoutUrls: [
        "http://localhost:3000",
        "http://localhost:5173",
        // Add production URLs here when deploying
      ],
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
      isProduction: IS_PRODUCTION,
    });
    new SecurityConstruct(this, "Security");

    const lambdas = new LambdasConstruct(this, "Lambdas", {
      vpc: networking.vpc,
      securityGroup: networking.lambdaSecurityGroup,
      projectionTable: database.projectionTable,
      eventsTable: database.eventsTable,
      chartBucket: storage.chartBucket,
      userBucket: storage.userBucket,
    });

    new MonitoringConstruct(this, "Monitoring", {
      chartFunction: lambdas.chartFunction,
    });

    const appSyncApi = new AppSynConstruct(this, "AppSync", {
      chartFunction: lambdas.chartFunction,
      userPool: cognito.userPool,
    });

    new cdk.CfnOutput(this, "GraphQLApiUrl", {
      value: appSyncApi.graphqlApi.graphqlUrl,
      description: "AppSync GraphQL API URL",
      exportName: `${this.stackName}-graphql-url`,
    });

    new cdk.CfnOutput(this, "GraphQLApiKey", {
      value: appSyncApi.graphqlApi.apiKey || "No API Key",
      description: "AppSync GraphQL API Key",
      exportName: `${this.stackName}-graphql-key`,
    });

    new cdk.CfnOutput(this, "ChartBucketName", {
      value: storage.chartBucket.bucketName,
      description: "Charts S3 bucket name",
      exportName: `${this.stackName}-chart-bucket`,
    });

    new cdk.CfnOutput(this, "UserBucketName", {
      value: storage.userBucket.bucketName,
      description: "User S3 bucket name",
      exportName: `${this.stackName}-user-bucket`,
    });

    new cdk.CfnOutput(this, "EventsTableName", {
      value: database.eventsTable.tableName,
      description: "DynamoDB Events table name",
      exportName: `${this.stackName}-events-table`,
    });

    new cdk.CfnOutput(this, "ProjectionTableName", {
      value: database.projectionTable.tableName,
      description: "DynamoDB Projection table name",
      exportName: `${this.stackName}-projection-table`,
    });

    new cdk.CfnOutput(this, "chartsDLQName", {
      value: lambdas.chartsDLQ.queueName,
      description: "SQS Chart DLQ name",
      exportName: `${this.stackName}-charts-dlq`,
    });
  }
}
