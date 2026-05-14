import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class RoleConstruct extends Construct {
  public readonly ingestionRole: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.ingestionRole = new iam.Role(this, "IngestionLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      roleName: "IngestionLambdaExecutionRole",
    });
  }
}
