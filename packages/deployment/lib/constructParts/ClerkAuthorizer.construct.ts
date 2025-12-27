import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";

export class ClerkAuthorizerConstruct extends Construct {
  public readonly authorizerFunction: lambda.Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.authorizerFunction = new lambda.Function(this, "ClerkAuthFunction", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../api/clerk-api/build")),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(5),
      memorySize: 256,
      environment: {
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
      },
      logGroup: new logs.LogGroup(this, "ClerkAuthLogGroup", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });
  }
}
