import * as pulumi from '@pulumi/pulumi';

import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";


export interface AWSDocumentDbArgs {
  // -- //
  backupRetentionPeriod: number;
  clusterIdentifier: string;
  engine: string;
  skipFinalSnapshot: boolean;
  preferredBackupWindow: string;
  /// graviteeMongoDBname: string;/// Create MongoDB ? not necessary, gravitee wil do it ?
  vpcSecurityGroupIds: pulumi.Input<string>[];
  vpcDocDbSubnetGroup: aws.rds.SubnetGroup
}

/**
*
*
* -------------------------------------------------------------------
*   AWS Document Db
* -------------------------------------------------------------------
* https://aws.amazon.com/getting-started/hands-on/getting-started-amazon-documentdb-with-aws-cloud9/
* https://docs.aws.amazon.com/documentdb/latest/developerguide/db-cluster-create.html
**/
export class AWSDocumentDb extends pulumi.ComponentResource {
  /// retention in days ?
  public readonly backupRetentionPeriod: pulumi.OutputInstance<number | undefined>;
  public readonly clusterIdentifier: pulumi.Output<string | undefined>;
  /// example value : 'docdb'
  public readonly engine: pulumi.Output<string | undefined>;
  public readonly skipFinalSnapshot: pulumi.Output<boolean | undefined>;
  /// A format has to be validated : ["04:00-06:00"]
  public readonly preferredBackupWindow: pulumi.Output<string | undefined>;
  public readonly endpoint: pulumi.Output<string | undefined>;
  /// public readonly graviteeMongoDBname: string; /// Create MongoDB ? not necessary, gravitee wil do it ?

  constructor (
     // Ces trois arguments seront attendus par le constructeur de
     // la classe Mère :  pulumi.ComponentResource
    name: string,
    args: AWSDocumentDbArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {

    super(`${pulumi.getProject()}:AWSDocumentDb`, name, {}, opts)

    /// +++
    /// AWS Document DB                 ==>>> External MongoDB for GRAVTIEE
    /// https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/aws/docdb/

    //// VERY SIMPLE DOC DB :
    const docdbInstance : aws.docdb.Cluster = new aws.docdb.Cluster('gioDocDbCluster', {
        backupRetentionPeriod: args.backupRetentionPeriod,
        clusterIdentifier: args.clusterIdentifier,
        engine: args.engine,
        masterPassword: "gravitee",
        masterUsername: "gravitee",
        preferredBackupWindow: args.preferredBackupWindow ,
        skipFinalSnapshot: args.skipFinalSnapshot,
        vpcSecurityGroupIds: args.vpcSecurityGroupIds,
        dbSubnetGroupName: args.vpcDocDbSubnetGroup.name
    });
    /// vpc_id for aws_security_group.internet_db_security_group
    this.backupRetentionPeriod = docdbInstance.backupRetentionPeriod;
    this.clusterIdentifier = docdbInstance.clusterIdentifier; /// e.g. "graviteedocdb-cluster"
    this.engine = docdbInstance.engine;
    this.skipFinalSnapshot = docdbInstance.skipFinalSnapshot;
    this.preferredBackupWindow = docdbInstance.preferredBackupWindow;
    this.endpoint = docdbInstance.endpoint;
    /// this.graviteeMongoDBname = args.graviteeMongoDBname;



    /**
    /// MORE COMPLEX DOCDB CLUSTER

    const moreRefined_Docdb_Cluster = new aws.docdb.Cluster("graviteedocdb", {
       clusterIdentifier: "graviteedocdb-cluster",
       availabilityZones: [
           "us-west-2a",
           "us-west-2b",
           "us-west-2c",
       ],
       masterUsername: "gravitee",
       masterPassword: "gravitee",
   });

   const clusterInstances: aws.docdb.ClusterInstance[] = [];
   for (const range = {value: 0}; range.value < 2; range.value++) {
       clusterInstances.push(new aws.docdb.ClusterInstance(`graviteedocdb-clusterInstance-${range.value}`, {
           identifier: `graviteedocdb-cluster-instance-${range.value}`,
           clusterIdentifier: moreRefined_Docdb_Cluster.id,
           instanceClass: "db.r5.large",
       }));
   }
   **/




   /// -------------------------------------------------------------------------
   /// Create MongoDB ? not necessary, gravitee wil do it ?
   /// -------------------------------------------------------------------------
   /// https://www.pulumi.com/docs/reference/pkg/aws/docdb/clusterparametergroup/#create





  }

}
