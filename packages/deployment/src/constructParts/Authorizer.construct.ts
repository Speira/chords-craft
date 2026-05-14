import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";

export class AuthorizerConstruct extends Construct {
  public readonly authorizerFunction: lambda.Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.authorizerFunction = new lambda.Function(this, "AuthFunction", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../api/auth-api/build")),
      environment: {
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
      },
      handler: "index.handler",
      logGroup: new logs.LogGroup(this, "ClerkAuthLogGroup", {
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      memorySize: 256,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(5),
    });
  }
}
