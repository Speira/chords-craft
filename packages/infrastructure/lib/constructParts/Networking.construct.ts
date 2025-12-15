import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface NetworkingProps {
  readonly maxAzs?: number;
  readonly natGateways?: number;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: NetworkingProps) {
    super(scope, id);

    // VPC with Public and Private Subnets
    this.vpc = new ec2.Vpc(this, "MyKpiVPC", {
      maxAzs: props?.maxAzs ?? 2,
      natGateways: props?.natGateways ?? 0, // Cost optimization
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: "Database",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Groups
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      "LambdaSecurityGroup",
      {
        vpc: this.vpc,
        description: "Security group for Lambda functions",
        allowAllOutbound: true,
      }
    );
  }
}
