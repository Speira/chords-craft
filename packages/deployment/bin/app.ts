#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';

import { ChordsChartStack } from '../src/ChordsChartStack';
import { resolveEnvironment } from '../src/environment';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'eu-west-3',
};
const environment = resolveEnvironment(app.node);
const stackName = `ChordsChart-${environment}`; // ChordsChart-dev
new ChordsChartStack(app, stackName, {
  env,
  tags: {
    Project: 'ChordsChartStack',
    Environment: environment,
    ManagedBy: 'CDK',
  },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
