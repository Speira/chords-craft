import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";

export interface MonitoringProps {
  readonly chartFunction: lambda.IFunction;
}

export class MonitoringConstruct extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, "ChordsChartDashboard", {
      dashboardName: "ChordsChart-Monitoring",
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "ChordsChart AppSync GraphQL Requests",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/AppSync",
            metricName: "4XXError",
            statistic: "Sum",
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: "AWS/AppSync",
            metricName: "5XXError",
            statistic: "Sum",
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: "Lambda Errors",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Errors",
            statistic: "Sum",
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
    );

    // SNS topic for alerts
    this.alertTopic = new sns.Topic(this, "ChartsAlertTopic", {
      displayName: "Charts Lambda Alerts",
    });

    // Alert on high error rate
    const errorAlarm = new cloudwatch.Alarm(this, "ChartsErrorAlarm", {
      metric: props.chartFunction.metricErrors({
        statistic: "Sum",
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: "Alert when charts Lambda has high error rate",
      alarmName: "charts-lambda-errors",
    });

    errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Alert on high throttles
    const throttleAlarm = new cloudwatch.Alarm(this, "ChartsThrottleAlarm", {
      metric: props.chartFunction.metricThrottles({
        statistic: "Sum",
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: "Alert when charts Lambda is being throttled",
      alarmName: "charts-lambda-throttles",
    });

    throttleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
  }
}
