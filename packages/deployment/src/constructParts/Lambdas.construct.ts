import * as cdk from 'aws-cdk-lib';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import type * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import path from 'path';

import K from '../constants';

export interface ILambdasConstruct {
  readonly eventsTable: dynamodb.ITable;
  readonly projectionTable: dynamodb.ITable;
  readonly chartBucket: s3.IBucket;
  readonly userBucket: s3.IBucket;
  readonly clerkAuthSecretPath: string;
  readonly isProduction: boolean;
}

export class LambdasConstruct extends Construct {
  public readonly authorizerFunction: lambda.Function;
  public readonly chartFunction: lambda.Function;
  public readonly chartsDLQ: sqs.Queue;

  constructor(scope: Construct, id: string, props: ILambdasConstruct) {
    super(scope, id);

    // Retrieve Clerk secret from Secrets Manager
    const clerkSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'ClerkSecret',
      props.clerkAuthSecretPath,
    );

    const stackName = cdk.Stack.of(this).stackName.toLowerCase();

    this.authorizerFunction = new lambda.Function(this, 'AuthFunction', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, `../${K.PATHS_FROM_SRC.PACKAGES_API_AUTH}/build`),
      ),
      environment: {
        CLERK_SECRET_NAME: clerkSecret.secretName,
      },
      handler: 'index.handler',
      logGroup: new logs.LogGroup(this, 'ChordsChartAuthLogGroup', {
        logGroupName: `/aws/lambda/auth-function-${stackName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      memorySize: 256,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(5),
    });

    // Grant auth function permission to read secret
    clerkSecret.grantRead(this.authorizerFunction);

    this.chartsDLQ = new sqs.Queue(this, 'ChartsDLQ', {
      queueName: `charts-lambda-dlq-${stackName}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    this.chartFunction = new lambda.Function(this, 'ChartFunction', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, `../${K.PATHS_FROM_SRC.PACKAGES_API_CHART}/build`),
      ),
      handler: 'index.handler',
      deadLetterQueue: this.chartsDLQ,
      deadLetterQueueEnabled: true,
      retryAttempts: 2,
      environment: {
        LOG_LEVEL: 'INFO',
        NODE_OPTIONS: '--enable-source-maps',
        NODE_ENV: props.isProduction ? 'production' : 'development',
        USER_BUCKET: props.userBucket.bucketName,
        CHART_BUCKET: props.chartBucket.bucketName,
        EVENTS_TABLE: props.eventsTable.tableName,
        PROJECTION_TABLE: props.projectionTable.tableName,
      },
      logGroup: new logs.LogGroup(this, `FunctionLogGroup-${stackName}`, {
        logGroupName: `/aws/lambda/chart-function-${stackName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      memorySize: 1024,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant DynamoDB permissions
    props.eventsTable.grantReadWriteData(this.chartFunction);
    props.projectionTable.grantReadWriteData(this.chartFunction);

    // Grant S3 permissions
    props.chartBucket.grantReadWrite(this.chartFunction);
    props.userBucket.grantReadWrite(this.chartFunction);
  }
}
