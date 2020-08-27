import * as pulumi from '@pulumi/pulumi';
import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";
import * as k8s from '@pulumi/kubernetes';
import * as eks from "@pulumi/eks";

import { policy } from './alb-iam-policy';

export interface AwsALBArgs {
  cluster: eks.Cluster;
  // k8snamespace: String;
  pulumiConfig: pulumi.Config;
}

/**
*
*
* -------------------------------------------------------------------
*   AWS ALB
*
* -------------------------------------------------------------------
* https://aws.amazon.com/blogs/containers/using-alb-ingress-controller-with-amazon-eks-on-fargate/
* https://www.pulumi.com/docs/reference/pkg/aws/alb/loadbalancer/
* https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/awsx/lb/#application-load-balancers
* https://www.pulumi.com/blog/kubernetes-ingress-with-aws-alb-ingress-controller-and-pulumi-crosswalk/ =>> the good one for AWS EKS Cluster, not an ECS Cluster
* -------------------------------------------------------------------
*
* In Fargate, ALB is far more suited than ELB
*
**/
export class AwsALB extends pulumi.ComponentResource {

  public readonly albIngressControllerHelmChart: k8s.helm.v3.Chart;


  constructor (
     // Ces trois arguments seront attendus par le constructeur de
     // la classe Mère :  pulumi.ComponentResource
    name: string,
    args: AwsALBArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {

    super(`${pulumi.getProject()}:AwsALB`, name, {}, opts)

    /**
    * ----------------------------------------------------------------------------------------------------------------
    * ----------------------------------------------------------------------------------------------------------------
    *  ALB Creation
    * ----------------------------------------------------------------------------------------------------------------
    * ----------------------------------------------------------------------------------------------------------------
    *
    **/
    // Create IAM Policy for the IngressController called "ingressController-iam-policy” and read the policy ARN.
    const ingressControllerPolicy = new aws.iam.Policy(
      "ingressController-iam-policy",
      {
        policy: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "acm:DescribeCertificate",
                "acm:ListCertificates",
                "acm:GetCertificate"
              ],
              Resource: "*"
            },
            {
              Effect: "Allow",
              Action: [
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:CreateSecurityGroup",
                "ec2:CreateTags",
                "ec2:DeleteTags",
                "ec2:DeleteSecurityGroup",
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceStatus",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeSubnets",
                "ec2:DescribeTags",
                "ec2:DescribeVpcs",
                "ec2:ModifyInstanceAttribute",
                "ec2:ModifyNetworkInterfaceAttribute",
                "ec2:RevokeSecurityGroupIngress"
              ],
              Resource: "*"
            },
            {
              Effect: "Allow",
              Action: [
                "elasticloadbalancing:AddTags",
                "elasticloadbalancing:CreateListener",
                "elasticloadbalancing:CreateLoadBalancer",
                "elasticloadbalancing:CreateRule",
                "elasticloadbalancing:CreateTargetGroup",
                "elasticloadbalancing:DeleteListener",
                "elasticloadbalancing:DeleteLoadBalancer",
                "elasticloadbalancing:DeleteRule",
                "elasticloadbalancing:DeleteTargetGroup",
                "elasticloadbalancing:DeregisterTargets",
                "elasticloadbalancing:DescribeListeners",
                "elasticloadbalancing:DescribeLoadBalancers",
                "elasticloadbalancing:DescribeLoadBalancerAttributes",
                "elasticloadbalancing:DescribeRules",
                "elasticloadbalancing:DescribeSSLPolicies",
                "elasticloadbalancing:DescribeTags",
                "elasticloadbalancing:DescribeTargetGroups",
                "elasticloadbalancing:DescribeTargetGroupAttributes",
                "elasticloadbalancing:DescribeTargetHealth",
                "elasticloadbalancing:ModifyListener",
                "elasticloadbalancing:ModifyLoadBalancerAttributes",
                "elasticloadbalancing:ModifyRule",
                "elasticloadbalancing:ModifyTargetGroup",
                "elasticloadbalancing:ModifyTargetGroupAttributes",
                "elasticloadbalancing:RegisterTargets",
                "elasticloadbalancing:RemoveTags",
                "elasticloadbalancing:SetIpAddressType",
                "elasticloadbalancing:SetSecurityGroups",
                "elasticloadbalancing:SetSubnets",
                "elasticloadbalancing:SetWebACL"
              ],
              Resource: "*"
            },
            {
              Effect: "Allow",
              Action: ["iam:GetServerCertificate", "iam:ListServerCertificates"],
              Resource: "*"
            },
            {
              Effect: "Allow",
              Action: [
                "waf-regional:GetWebACLForResource",
                "waf-regional:GetWebACL",
                "waf-regional:AssociateWebACL",
                "waf-regional:DisassociateWebACL"
              ],
              Resource: "*"
            },
            {
              Effect: "Allow",
              Action: ["tag:GetResources", "tag:TagResources"],
              Resource: "*"
            },
            {
              Effect: "Allow",
              Action: ["waf:GetWebACL"],
              Resource: "*"
            }
          ]
        }
      }
    );

    // Attach this policy to the NodeInstanceRole of the worker nodes :
    // that's for EKS Cluster with Managed nodes. We are on EKS Fargate, so
    // it is the pod execution IAM Role playing here, and it is fully managed by pulumi : nothing to do
    // see
    /*
    const nodeinstanceRole = new aws.iam.RolePolicyAttachment(
      "eks-NodeInstanceRole-policy-attach",
      {
        policyArn: ingressControllerPolicy.arn,
        role: clusterNodeInstanceRoleName
      }
    ); */ // I think I have to attach this one policy to [podsAWSRole] defined for fargate profile creation


    // Declare the ALBIngressController in 1 step with the Helm Chart.
    this.albIngressControllerHelmChart = new k8s.helm.v3.Chart(
      "alb",
      {
        chart:
          "http://storage.googleapis.com/kubernetes-charts-incubator/aws-alb-ingress-controller-0.1.9.tgz",
        values: {
          clusterName: args.cluster.eksCluster.name,
          autoDiscoverAwsRegion: "true",
          autoDiscoverAwsVpcID: "true",
          awsVpcID: `${args.cluster.eksCluster.vpcConfig.vpcId}`,
          awsRegion: `${aws.config.region}`/// "eu-west-1",
          // have a look at [components/aws/networking/aws-alb-ingress-controller/values.yaml] in this repo
        }
      },
      { provider: args.cluster.provider }
    );


    /// Set up OIDC provider with the cluster is already done in [index.ts] with [createOidcProvider: true] option
    // nd create the IAM policy used by the ALB Ingress Controller

    /**
    * ----------------------------------------------------------------------------------------------------------------
    * ----------------------------------------------------------------------------------------------------------------
    *  BEFORE ALB Creation : A  useful Team Management feature is to have seamless [OpenID Connect] User Management
    * ----------------------------------------------------------------------------------------------------------------
    * ----------------------------------------------------------------------------------------------------------------
    * Creates an AWS IAM Policy fit for the ALB to use
    **/
    /// Set up OIDC provider with the cluster is already done in [index.ts] with [createOidcProvider: true] option
    // now  create the IAM policy that will be used by the ALB Ingress Controller deployment.
    /**
    * With AWS CLI , this would be :
    * wget -O alb-ingress-iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/master/docs/examples/iam-policy.json
    * aws iam create-policy --policy-name ALBIngressControllerIAMPolicy --policy-document file://alb-ingress-iam-policy.json
    * ----
    * And with Pulumi , we will do it like this :
    * https://www.pulumi.com/blog/eks-oidc/#create-iam-for-a-s3-app
    **/


  }
  /**
   * utility to create a K8S namespace
   **/
  createNewNamespace(name: string, cluster: eks.Cluster): k8s.core.v1.Namespace {
    //Create new namespace
    return new k8s.core.v1.Namespace(
      name,
      { metadata: { name: name } },
      { provider: cluster.provider }
    );
  }

}
