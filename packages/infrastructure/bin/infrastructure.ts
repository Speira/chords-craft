#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";

import { ChordsChartStack } from "../lib/chordschart-stack";

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: "eu-west-3",
};
new ChordsChartStack(app, "ChordsChartStack", {
  env,
  tags: {
    Project: "ChordsChartStack",
    Environment: "Production",
    ManagedBy: "CDK",
  },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
