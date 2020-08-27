import * as pulumi from '@pulumi/pulumi';
import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";


export interface UnderlayVPCArgs {
  // -- //
  /// Could be used used to set networking Security Groups rules
  /// (permissions to connect to Mongo), if using an external MongoDB
  /// inside the same VPC, but not in the EKS Fargate cluster
  externalMongoDBport: string;
  /**
  fargateSecGroup: awsx.ec2.SecurityGroup;
  fargateSecGroup:  awsx.ec2.SecurityGroup;
  documentdbSecGroup:  awsx.ec2.SecurityGroup;
  awsElasticsearchSecGroup:  awsx.ec2.SecurityGroup;
  vpc: awsx.ec2.Vpc;
  **/
}

/**
*
*
* -------------------------------------------------------------------
*   AWS VPC, security groups,
*   subnets and ACLs
* -------------------------------------------------------------------
* https://aws.amazon.com/getting-started/hands-on/getting-started-amazon-documentdb-with-aws-cloud9/
* https://docs.aws.amazon.com/documentdb/latest/developerguide/db-cluster-create.html
* -------------------------------------------------------------------
*
* AWS provides two features that you can use to increase security in your VPC:
* security groups and network ACLs. Security groups control inbound and outbound
* traffic for your instances, and network ACLs control inbound and outbound traffic for
* your subnets.
*
**/
export class UnderlayVPC extends pulumi.ComponentResource {

  public readonly vpc: awsx.ec2.Vpc;

  private externalMongoDBport: string;
  public getexternalMongoDBport () : string {
    return this.externalMongoDBport;
  }

  /**
  private fargatePubNetId : pulumi.Output<string>;
  private fargatePrivNetId : pulumi.Output<string>;
  private documentdbPrivNetId : pulumi.Output<string>;
  private awsElasticsearchPrivNetId : pulumi.Output<string>;

  public getFargatePubNetId () : pulumi.Output<string>{
    return this.fargatePrivNetId;
  }
  public getFargatePrivNetId () : pulumi.Output<string>{
    return this.fargatePrivNetId;
  }
  public getDocumentdbPrivNetId () : pulumi.Output<string>{
  return this.fargatePrivNetId;
  }
  public getAwsElasticsearchPrivNetId () : pulumi.Output<string>{
    return this.fargatePrivNetId;
  }
  **/

  // 0) Allocate a security group and then a series of rules:
  /// public readonly fargateSecGroup: awsx.ec2.SecurityGroup;
  /// public readonly documentdbSecGroup: awsx.ec2.SecurityGroup;
  /// public readonly awsElasticsearchSecGroup: awsx.ec2.SecurityGroup;

  constructor (
     // Ces trois arguments seront attendus par le constructeur de
     // la classe Mère :  pulumi.ComponentResource
    name: string,
    args: UnderlayVPCArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {

    super(`${pulumi.getProject()}:UnderlayVPC`, name, {}, opts)

    this.externalMongoDBport = args.externalMongoDBport;
    /*
    this.vpc = args.vpc;
    this.fargateSecGroup = args.fargateSecGroup;
    this.fargateSecGroup = args.fargateSecGroup;
    this.documentdbSecGroup = args.documentdbSecGroup;
    this.awsElasticsearchSecGroup = args.awsElasticsearchSecGroup;
    */
    /**
     * ----------------------------------------------------------------------------------------------------------------
     * ----------------------------------------------------------------------------------------------------------------
     *  AWS Networking (all infra)
     * ----------------------------------------------------------------------------------------------------------------
     * ----------------------------------------------------------------------------------------------------------------
     **/

    // Create a VPC for our cluster, and our External Services : [MongoDB] and [Elasticsearch]

    this.vpc = new awsx.ec2.Vpc("graviteeio_vpc", {
          subnets: [
            { type: "public", name: "gioOnFargatePOCVpcPubNet" },
            { type: "private", name: "gioOnFargatePOCVpcPrivNet" },
            // { type: "isolated", name: "documentdbSubnet" },
            /// { type: "isolated", name: "elasticsearch" },
        ],
        //database_subnets: { type: "private", name: "documentdbSubnet" }

    });

    // 0) Allocate a security group and then a series of rules:
    /// this.fargateSecGroup = new awsx.ec2.SecurityGroup("fargateSecGroup", { vpc:this.vpc });
    // this.documentdbSecGroup = new awsx.ec2.SecurityGroup("documentdbSecGroup", { vpc:this.vpc });
    // this.awsElasticsearchSecGroup = new awsx.ec2.SecurityGroup("awsElasticsearchSecGroup", { vpc:this.vpc });

    // --------------------------------------------------------------------
    // fargateSecGroup
    // --------------------------------------------------------------------
    /*

    // 1) inbound HTTPS traffic on port 443 from anywhere
    this.fargateSecGroup.createIngressRule("fargate-https-access", {
        location: { cidrBlocks: [ "0.0.0.0/0" ] },
        ports: { protocol: "tcp", fromPort: 443 },
        description: "allow HTTPS access from anywhere",
    });
    // 2) inbound HTTPS traffic on port 80 from anywhere
    this.fargateSecGroup.createIngressRule("fargate-http-access", {
        location: { cidrBlocks: [ "0.0.0.0/0" ] },
        ports: { protocol: "tcp", fromPort: 80 },
        description: "allow HTTP access from anywhere",
    });
    */
    /*
    // 1 & 2 unsecure) outbound TCP traffic on any port to anywhere
    this.fargateSecGroup.createIngressRule("fargate-inbound-access", {
        location: { cidrBlocks: [ "0.0.0.0/0" ] },
        ports: { protocol: "tcp", fromPort: 65535 },
        description: "allow inbound access from anywhere Fargate Cluster",
    });
    // 3) outbound TCP traffic on any port to anywhere
    this.fargateSecGroup.createEgressRule("fargate-outbound-access", {
        location: { cidrBlocks: [ "0.0.0.0/0" ] },
        ports: { protocol: "tcp", fromPort: 65535 },
        description: "allow outbound access to anywhere",
    });
    */
    // --------------------------------------------------------------------
    // fargateSecGroup
    // --------------------------------------------------------------------



    /// [fargateSecGroup] allow inbound access on any port from [documentdbSecGroup] => nope, isolated subnet for docuement db
    /*
    this.fargateSecGroup.createIngressRule("fargateSecGroup-inbound-mongo-http-access", {
        location: { cidrBlocks: [ "0.0.0.0/0" ], sourceSecurityGroupId : this.documentdbSecGroup.id },
        ports: { protocol: "tcp", fromPort: 65535 },
        description: "[fargateSecGroup] allow inbound access on any port from [documentdbSecGroup]",
    });
    */

    /*

    /// [fargateSecGroup] allow inbound access over HTTP from [fargateSecGroup]
    fargateSecGroup.createIngressRule("fargateSecGroup-inbound-gravitee-http-access", {
        location: { cidrBlocks: [ "0.0.0.0/0" ], sourceSecurityGroupId : fargateSecGroup.id },
        ports: { protocol: "tcp", fromPort: 80 },
        description: "[fargateSecGroup] allow inbound access over HTTP from [fargateSecGroup]",
    });
    /// [fargateSecGroup] allow inbound access over HTTPS from [fargateSecGroup]
    fargateSecGroup.createIngressRule("fargateSecGroup-inbound-gravitee-https-access", {
        location: { cidrBlocks: [ "0.0.0.0/0" ], sourceSecurityGroupId : fargateSecGroup.id },
        ports: { protocol: "tcp", fromPort: 443 },
        description: "[fargateSecGroup] allow inbound access over HTTPS from [fargateSecGroup]",
    });

    */

    // --------------------------------------------------------------------
    // documentdbSecGroup
    // --------------------------------------------------------------------
    // For example, to update your security group 'sg-aaaa1111' to allow
    // inbound access over HTTP from 'sg-bbbb2222' that's in a peer VPC, you
    // can use the following AWS CLI command:
    //
    // aws ec2 authorize-security-group-ingress --group-id sg-aaaa1111 --protocol tcp --port 80 --source-group sg-bbbb2222

    // update security group 'sg-aaaa1111' to allow inbound access over
    // HTTP from 'sg-bbbb2222'

    /// [documentdbSecGroup] allow inbound access over HTTP from [fargateSecGroup] on port 27017
    // DONT KNOW IF TOO RESTRICTIVE :
    /**
    this.documentdbSecGroup.createIngressRule("documentdbSecGroup-inbound-gravitee-mongo-access", { // when isolated network
        location: { sourceSecurityGroupId : this.fargateSecGroup.id },
        ports: { protocol: "tcp", fromPort: this.externalMongoDBport },
        description: "[documentdbSecGroup] allow inbound access over HTTP from [fargateSecGroup]"
    });
    **/
    /*
    this.documentdbSecGroup.createIngressRule("documentdbSecGroup-inbound-gravitee-mongo-access", {
        location: { cidrBlocks: [ "0.0.0.0/0" ] },
        ports: { protocol: "tcp", fromPort: 65535 },
        description: "[documentdbSecGroup] allow inbound access over HTTP from everywhere"
    });
    this.documentdbSecGroup.createEgressRule("documentdbSecGroup-inbound-gravitee-mongo-access", {
        location: { cidrBlocks: [ "0.0.0.0/0" ] },
        ports: { protocol: "tcp", fromPort: 65535 },
        description: "[documentdbSecGroup] allow Outbound access over HTTP to everywhere"
    });
    */
  }

}

// --------------------------------------------------------------------
// awsElasticsearchSecGroup
// --------------------------------------------------------------------


/*
const vpc = new awsx.ec2.Vpc("gioOnFargate_vpc", {
  subnets: [
    { type: "public" },
    { type: "private" },
    /// { type: "isolated", name: "documentdb" },
    /// { type: "isolated", name: "elasticsearch" },
],});
*/

/**

// Allocate a security group and then a series of rules:
const sg = new awsx.ec2.SecurityGroup("sg", { vpc });

// 1) inbound SSH traffic on port 22 from a specific IP address
sg.createIngressRule("ssh-access", {
    location: { cidrBlocks: [ "203.0.113.25/32" ] },
    ports: { protocol: "tcp", fromPort: 22 },
    description: "allow SSH access to 203.0.113.25",
});


// 2) inbound HTTPS traffic on port 443 from anywhere
sg.createIngressRule("https-access", {
    location: { cidrBlocks: [ "0.0.0.0/0" ] },
    ports: { protocol: "tcp", fromPort: 443 },
    description: "allow HTTPS access from anywhere",
});

// 3) outbound TCP traffic on any port to anywhere
sg.createEgressRule("outbound-access", {
    location: { cidrBlocks: [ "0.0.0.0/0" ] },
    ports: { protocol: "tcp", fromPort: 65535 },
    description: "allow outbound access to anywhere",
});
**/
/**
 * Could also try [cidrBlocks]
const vpc = new aws.ec2.Vpc("gioOnFargate_vpc", {
    cidrBlock: "10.0.0.0/16"
})
*/
