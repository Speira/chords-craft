import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface DatabaseProps {
  readonly stackName: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class DatabaseConstruct extends Construct {
  public readonly eventsTable: dynamodb.Table;
  public readonly projectionTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const removalPolicy = props.removalPolicy ?? cdk.RemovalPolicy.DESTROY;

    this.eventsTable = new dynamodb.Table(this, "ChartsEventsTable", {
      tableName: `${props.stackName.toLowerCase()}-charts_events`,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      }
    });

    this.projectionTable = new dynamodb.Table(this, "ChartsProjectionTable", {
      tableName: `${props.stackName.toLowerCase()}-charts_projection`,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      }
    });

    this.projectionTable.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
    });

    // Outputs
    new cdk.CfnOutput(this, "EventsTableName", {
      value: this.eventsTable.tableName,
    });

    new cdk.CfnOutput(this, "ProjectionTableName", {
      value: this.projectionTable.tableName,
    });
  }
}
