#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";

import { ChordsCraftStack } from "../lib/chordscraft-stack";

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: "eu-west-3",
};
new ChordsCraftStack(app, "ChordsCraftStack", {
  env,
  tags: {
    Project: "ChordsCraftStack",
    Environment: "Production",
    ManagedBy: "CDK",
  },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
