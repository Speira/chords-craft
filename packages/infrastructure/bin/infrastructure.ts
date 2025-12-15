#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";

import { InfrastructureStack } from "../lib/infrastructure-stack";

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: "eu-west-3",
};
new InfrastructureStack(app, "InfrastructureStack", {
  env,
  tags: {
    Project: "MyKpi",
    Environment: "Production",
    ManagedBy: "CDK",
  },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
