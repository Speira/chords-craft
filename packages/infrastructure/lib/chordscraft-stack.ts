import * as cdk from "aws-cdk-lib/core";
import { type Construct } from "constructs";

import {
  CognitoConstruct,
  DatabaseConstruct,
  NetworkingConstruct,
  StorageConstruct,
} from "./constructParts";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ChordsCraftStack extends cdk.Stack {
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
  }
}
