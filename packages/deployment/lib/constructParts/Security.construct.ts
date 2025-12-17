import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

export class SecurityConstruct extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // WAF Web ACL for AppSync protection
    this.webAcl = new wafv2.CfnWebACL(this, "ChordsChartWebACL", {
      defaultAction: { allow: {} },
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "ChordsChartWebACLMetric",
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "RateLimitRule",
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: "IP",
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "RateLimitRuleMetric",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "SQLInjectionRule",
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesSQLiRuleSet",
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "SQLInjectionRuleMetric",
            sampledRequestsEnabled: true,
          },
        },
      ],
    });
  }
}
