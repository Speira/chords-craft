import path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import type * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

import K from '../constants';

export interface AppSyncApiProps {
  readonly chartFunction: lambda.IFunction;
  readonly authorizerFunction: lambda.IFunction;
  readonly isProduction: boolean;
}

export class AppSynConstruct extends Construct {
  public readonly graphqlApi: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncApiProps) {
    super(scope, id);

    const stackName = cdk.Stack.of(this).stackName;

    // File Automatically generated on build/synth command
    const schemaFilePath = path.join(__dirname, `../${K.PATHS_FROM_SRC.GRAPHQL_SCHEMAS}`);

    const authConfig: appsync.AuthorizationConfig = {
      defaultAuthorization: {
        authorizationType: appsync.AuthorizationType.LAMBDA,
        lambdaAuthorizerConfig: {
          handler: props.authorizerFunction,
          resultsCacheTtl: cdk.Duration.minutes(5),
        },
      },
    };

    this.graphqlApi = new appsync.GraphqlApi(this, 'ChordsChart', {
      name: `${stackName} GraphQL API`,
      definition: appsync.Definition.fromFile(schemaFilePath),
      authorizationConfig: authConfig,
      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: props.isProduction ? appsync.FieldLogLevel.ERROR : appsync.FieldLogLevel.ALL,
        retention: logs.RetentionDays.ONE_WEEK,
      },
    });

    const chartDataSource = this.graphqlApi.addLambdaDataSource(
      'ChartDataSource',
      props.chartFunction,
    );

    chartDataSource.createResolver('GetChartResolver', {
      typeName: 'Query',
      fieldName: 'getChart',
    });
    chartDataSource.createResolver('ListChartsResolver', {
      typeName: 'Query',
      fieldName: 'listCharts',
    });
    chartDataSource.createResolver('CreateChartResolver', {
      typeName: 'Mutation',
      fieldName: 'createChart',
    });
  }
}
