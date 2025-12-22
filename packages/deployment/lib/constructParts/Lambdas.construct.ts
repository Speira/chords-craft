import * as cdk from "aws-cdk-lib";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import type * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import path from "path";

export interface ILambdasConstruct {
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
  readonly eventsTable: dynamodb.ITable;
  readonly projectionTable: dynamodb.ITable;
  readonly chartBucket: s3.IBucket;
  readonly userBucket: s3.IBucket;
}

export class LambdasConstruct extends Construct {
  public readonly chartFunction: lambda.Function;
  public readonly chartsDLQ: sqs.Queue;

  constructor(scope: Construct, id: string, props: ILambdasConstruct) {
    super(scope, id);

    this.chartsDLQ = new sqs.Queue(this, "ChartsDLQ", {
      queueName: "charts-lambda-dlq",
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    this.chartFunction = new lambda.Function(this, "ChartFunction", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../api/chart-api/build")),
      handler: "index.handler",
      deadLetterQueue: this.chartsDLQ,
      deadLetterQueueEnabled: true,
      retryAttempts: 2,
      environment: {
        LOG_LEVEL: "INFO",
        NODE_OPTIONS: "--enable-source-maps",
        NODE_ENV: "production",
        USER_BUCKET: props.userBucket.bucketName,
        CHART_BUCKET: props.chartBucket.bucketName,
        EVENTS_TABLE: props.eventsTable.tableName,
        PROJECTION_TABLE: props.projectionTable.tableName,
      },
      logGroup: new logs.LogGroup(this, "ChordsChartFunctionLogGroup", {
        logGroupName: `/aws/lambda/chart-function-${cdk.Stack.of(this).stackName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      memorySize: 1024,
      runtime: lambda.Runtime.NODEJS_18_X,
      securityGroups: [props.securityGroup],
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      // reservedConcurrentExecutions: 5,
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
    props.eventsTable.grantReadWriteData(this.chartFunction);
    props.projectionTable.grantReadWriteData(this.chartFunction);
  }
}
