import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface StorageProps {
  readonly stackName: string;
  readonly account: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
  readonly autoDeleteObjects?: boolean;
}

export class StorageConstruct extends Construct {
  public readonly chartBucket: s3.Bucket;
  public readonly userBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageProps) {
    super(scope, id);

    const removalPolicy = props.removalPolicy ?? cdk.RemovalPolicy.DESTROY;
    const autoDeleteObjects = props.autoDeleteObjects ?? true;

    this.chartBucket = new s3.Bucket(this, "ChartBucket", {
      bucketName: `${props.stackName.toLowerCase()}-charts-${props.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects,
      lifecycleRules: [
        {
          id: "DeleteOldVersions",
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // User Bucket
    this.userBucket = new s3.Bucket(this, "UserBucket", {
      bucketName: `${props.stackName.toLowerCase()}-users-${props.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects,
    });
  }
}
