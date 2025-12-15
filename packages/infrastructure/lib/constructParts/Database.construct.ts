import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface DatabaseProps {
  readonly stackName: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class DatabaseConstruct extends Construct {
  public readonly metadataTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const removalPolicy = props.removalPolicy ?? cdk.RemovalPolicy.DESTROY;

    this.metadataTable = new dynamodb.Table(this, "MetadataTable", {
      tableName: `${props.stackName.toLowerCase()}-metadata`,

      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },

      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "ttl",
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES, // For auditing/data pipeline
    });

    this.metadataTable.addGlobalSecondaryIndex({
      indexName: "GSI1",

      partitionKey: { name: "GSI1_PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1_SK", type: dynamodb.AttributeType.STRING },

      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Output the table name for consumption by Lambda environments
    new cdk.CfnOutput(this, "MetadataTableName", {
      value: this.metadataTable.tableName,
      description: "Name of the primary DynamoDB metadata table.",
      exportName: `${props.stackName}-metadata-table-name`,
    });
  }
}
