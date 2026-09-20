import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import type * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface MonitoringProps {
  readonly authorizerFunction: lambda.IFunction;
  readonly chartFunction: lambda.IFunction;
  readonly stackName: string;
  readonly isProduction: boolean;
  readonly apiId: string;
}

export class MonitoringConstruct extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'ChordsChartDashboard', {
      dashboardName: `${props.stackName}-Monitoring`,
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `${props.stackName} AppSync GraphQL Requests`,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/AppSync',
            metricName: '4XXError',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              GraphQLApiId: props.apiId,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/AppSync',
            metricName: '5XXError',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              GraphQLApiId: props.apiId,
            },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: `${props.stackName} Lambda Errors`,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              FunctionName: props.authorizerFunction.functionName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            dimensionsMap: {
              FunctionName: props.chartFunction.functionName,
            },
          }),
        ],
      }),
    );

    // SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'ChordChartsAlertTopic', {
      displayName: `${props.stackName} Lambda Alerts`,
    });

    if (props.isProduction) {
      this.alertTopic.addSubscription(
        new cdk.aws_sns_subscriptions.EmailSubscription('chordcrafts-alerts@telek-software.com'),
      );
    }

    // Alert on high error rate
    const authAlarm = new cloudwatch.Alarm(this, 'AuthErrorAlarm', {
      metric: props.authorizerFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when auth Lambda has high error rate',
      alarmName: `${props.stackName.toLowerCase()}-auth-lambda-errors`,
    });
    authAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    const errorAlarm = new cloudwatch.Alarm(this, 'ChartsErrorAlarm', {
      metric: props.chartFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when charts Lambda has high error rate',
      alarmName: `${props.stackName.toLowerCase()}-charts-lambda-errors`,
    });
    errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Alert on high throttles
    const throttleAlarm = new cloudwatch.Alarm(this, 'ChartsThrottleAlarm', {
      metric: props.chartFunction.metricThrottles({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when charts Lambda is being throttled',
      alarmName: `${props.stackName.toLowerCase()}-charts-lambda-throttles`,
    });

    throttleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
  }
}
