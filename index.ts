import * as pulumi from '@pulumi/pulumi';
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
/// import  { GraviteeKube } from './components/kubernetes/GraviteeKube';
import  { GraviteeAPIMKube } from './components/kubernetes/GraviteeAPIMKube';

/// import  { TraefiKube } from './components/kubernetes/TraefiKube';
/// import { AWSDocumentDb } from './components/aws/documentdb/AWSDocumentDb';

import { UnderlayVPC } from './components/aws/networking/UnderlayVPC'

import { AwsALB } from './components/aws/networking/AwsALB'

export const pulumiEnvironment = pulumi.getStack();

/**
 * PULUMI PROJECT CONFIGURATION
 **/

const pulumiConfig = new pulumi.Config();
/// export PULUMI_PROJECT_NAME='gio_fargate' ===>>> When you run [pulumi new aws-typescript -n ${PROJECT_NAME} -s {PULUMI_STACK_NAME} --secrets-provider hashivault]
/// export PULUMI_STACK_NAME='gio_fargate'

/// --- [~/.aws/credentials] actually could not exists as a file, in which case, you will HAVE to set AWS credentails this way :
/// AWS_ACCESS_KEY_ID Can be configured by running [pulumi config set aws:accessKey <you aws account access key id>]
/// AWS_SECRET_ACCESS_KEY Can be configured by running [pulumi config set aws:secretKey <you aws account access key id> --secret]
/// Note : the [--secret] GNU Option is exetremely important, to manage secrets with Pulumi 's configured
/// Secret Manager, Gravitee Recommends HashiCorp Vault', see :
///  [ --secrets-provider hashivault] GNU option to create a new Pulumi Project
///
console.log('----');
console.log('---- AWS [~/.aws/credentials] must exists, and the AWS Profile which will be used : ');
console.log(' Can be configured by setting the [export AWS_PROFILE] env. var value, in your pulumi execution environment ');
console.log(' Can be configured by running [pulumi config set aws:profile <profilename>] ');
console.log('---- if the [default] AWS_PROFILE is inside of it will be used.  ');
// aws.config.profile
// aws.config.accessKey
console.log(` > AWS_PROFILE is : ${aws.config.profile}`)
console.log(` > AWS_REGION is: ${aws.config.region}`)
// console.log(` > AWS_REGION is: ${aws.config.accessKey}`)
// console.log(` > AWS_REGION is: ${aws.config.secretKey}`)


/// export CORPORATE_DOMAIN_NAME='mycompany.io'
/// pulumi config set ${PULUMI_PROJECT_NAME}:corporate_domain_name "${CORPORATE_DOMAIN_NAME}" -s "${PULUMI_STACK_NAME}"
console.log('----');
console.log('---- Corporate domain name (your companys API common domain name) ');
console.log(' Example : if your expose you API through [https://api.mycompany.io] ');
console.log(' Then set this configuration parameter to [mycompany.io] ');
console.log('----  ');
console.log(` Corporate domain name is set to ${pulumiConfig.require("corporate_domain_name")} `);
console.log('----');


/// export K8S_NAMESPACE='default'
/// pulumi config set ${PULUMI_PROJECT_NAME}:k8s_namespace "${K8S_NAMESPACE}" -s "${PULUMI_STACK_NAME}"
console.log('----');
console.log('----  Kubernetes Namespace ');
console.log('----');
console.log(' This where your applications including their APIs, and Gravitee API Gateway will deployed');
console.log('----');
console.log(` Configured K8S namespace for https://${pulumiConfig.require("corporate_domain_name")} Apps and API Gateway is : ${pulumiConfig.require("k8s_namespace")}`);
console.log('----');


/// export DESIRED_FARGATE_PROFILE_NAME='myfargateprofile'
/// pulumi config set ${PULUMI_PROJECT_NAME}:desired_fargate_profile_name "${DESIRED_FARGATE_PROFILE_NAME}" -s "${PULUMI_STACK_NAME}"
console.log('----');
console.log('---- Fargate Profile Name');
console.log('----  ');
console.log(` Fargate Profile name is set to [${pulumiConfig.require("desired_fargate_profile_name")}] `);
console.log(` Fargate Profile will be created in the ${pulumiConfig.require("k8s_namespace")} Kubernetes namespace `);
console.log('----');




/// export GRAVITEE_APIM_CHART_VERSION='3.0.4'
/// pulumi config set ${PULUMI_PROJECT_NAME}:gravitee_apim_chart_version "${GRAVITEE_APIM_CHART_VERSION}" -s "${PULUMI_STACK_NAME}"
console.log('----');
console.log('---- Gravitee Helm Chart ');
console.log(`To check the lastest stable Gravitee APIM Helm Chart version, run the following commands with Helm v3 in a shell terminal : ${pulumiConfig.require("gravitee_apim_chart_version")}`);
console.log(`helm repo add graviteeio https://helm.gravitee.io`);
console.log(`helm search repo graviteeio`);
/// export GIO_K8S_HELM_RELEASE_NAME="graviteeio-apim3x"
/// pulumi config set ${PULUMI_PROJECT_NAME}:gravitee_apim_helm_release_name ${GIO_K8S_DEPLOYMENT_NAME} -s ${PULUMI_STACK_NAME}
console.log('-');
console.log(` > Helm Chart Repo Id (the Id of the chart inside the helm repo) : ${pulumiConfig.require("gravitee_apim_helm_chart_repo_id")}`);
console.log(` > Helm Chart version : ${pulumiConfig.require("gravitee_apim_chart_version")}`);
console.log(` > Helm Release name : ${pulumiConfig.require("gravitee_apim_helm_release_name")}`);
console.log('----');
console.log('----');

/// export GRAVITEE_CONTAINERS_TAG='3.1.1'
/// pulumi config set ${PULUMI_PROJECT_NAME}:gravitee_containers_tag "${GRAVITEE_CONTAINERS_TAG}" -s "${PULUMI_STACK_NAME}"
console.log('----');
console.log('---- Gravitee Containers ');
console.log(``);
console.log(`All Gravitee components docker images are designed to be run with homogeneous TAG (versions).`);
console.log(`When you run Gravitee, you have to set the exact same OCI image version tag. For example :`);
console.log(` > graviteeio/apim-gateway:3.1.1`);
console.log(` > graviteeio/apim-management-ui:3.1.1`);
console.log(` > graviteeio/apim-management-api:3.1.1`);
console.log(` `);
console.log(` etc...`);
console.log(` `);
console.log(`Configuration of the Gravitee APIM Containers tag is set to  : ${pulumiConfig.require("gravitee_containers_tag")}`);
console.log('----');

/// --- External MongoDB and Elasticsearch configuration values are top level parameters for the
/// pulumi recipe :

console.log('----');
console.log('---- Gravitee External Data persistence ');
/// export MONGO_DB_NAME="gravitee_db"
/// pulumi config set ${PULUMI_PROJECT_NAME}:mongo_db_name ${MONGO_DB_NAME} -s ${PULUMI_STACK_NAME}
console.log(`Configuration of the Gravitee External MongoDB HOST : ${pulumiConfig.require("mongo_db_name")}`);
/// export MONGO_HOST="54.228.103.148"
/// pulumi config set ${PULUMI_PROJECT_NAME}:mongo_host ${MONGO_HOST} -s ${PULUMI_STACK_NAME}
console.log(`Configuration of the Gravitee External MongoDB HOST : ${pulumiConfig.require("mongo_host")}`);
/// export MONGO_PORT="27017"
/// pulumi config set ${PULUMI_PROJECT_NAME}:mongo_port ${MONGO_PORT} -s ${PULUMI_STACK_NAME}
console.log(`Configuration of the Gravitee External MongoDB PORT : ${pulumiConfig.require("mongo_port")}`);
/// export MONGO_URI_PROTOCOL="http" /// 2 possible values : [http] or [https]
/// pulumi config set ${PULUMI_PROJECT_NAME}:mongo_uri_protocol ${MONGO_PORT} -s ${PULUMI_STACK_NAME}
console.log(`Configuration of the Gravitee External MongoDB URI PROTOCOL ( 2 possible values : either 'mongodb' or 'mongodb+srv') : ${pulumiConfig.require("mongo_uri_protocol")}`);
console.log("Given the configured {Mongo DB HOST}, {MongoDB PORT}, and {MongoDB URI PROTOCOL}, the Gravitee External MongoDB Full URI will be :" + `${pulumiConfig.require("mongo_uri_protocol")}` + "://" + `${pulumiConfig.require("mongo_host")}` + ":" + `${pulumiConfig.require("mongo_port")}` + `/${pulumiConfig.require("mongo_db_name")}?serverSelectionTimeoutMS=5000&connectTimeoutMS=30000&socketTimeoutMS=30000`);

// basic constraints checking on [mongo_uri_protocol] error management
const mongo_uri_protocol_value_tocheck = `${pulumiConfig.require("mongo_uri_protocol")}`;
if ( mongo_uri_protocol_value_tocheck === 'mongodb') {
  // then we're good
} else {
  if ( mongo_uri_protocol_value_tocheck === 'mongodb+srv') {
    // then we're good
  } else {
    // then we're not good
    let errmsg = `[mongo_uri_protocol] value should be set either 'mongodb' or 'mongodb+srv', but your curent value is '${mongo_uri_protocol_value_tocheck}'`;
    errmsg += " Please reset [mongo_uri_protocol] value  either to either 'mongodb' or 'mongodb+srv', using the command `pulumi config set <your pulumi project name>:mongo_uri_protocol <value>`"
    throw new Error(errmsg);
  }
}
/// export PULUMI_STACK_NAME='${PULUMI_STACK_NAME}'
/// export ES_ENDPOINT="http://54.228.103.148:9200"
/// pulumi config set ${PULUMI_PROJECT_NAME}:elastic_endpoint ${ES_ENDPOINT} -s ${PULUMI_STACK_NAME}
console.log(`Configuration of the Gravitee External Elasticsearch endpoint : ${pulumiConfig.require("elastic_endpoint")}`);

/// export KUBECTL_PORT_FORWARD_MGMT_UI="8002"
/// pulumi config set ${PULUMI_PROJECT_NAME}:kubectl_port_forward_mgmt_ui ${KUBECTL_PORT_FORWARD_MGMT_UI} -s ${PULUMI_STACK_NAME}
/// export KUBECTL_PORT_FORWARD_MGMT_API="8383"
/// pulumi config set ${PULUMI_PROJECT_NAME}:kubectl_port_forward_mgmt_api ${KUBECTL_PORT_FORWARD_MGMT_API} -s ${PULUMI_STACK_NAME}
console.log('----');
console.log('---- Gravitee Admin Staff ');
console.log(`Admin Staff only will access APIM Management UI using the 2 following [kubectl port-forward] commands, executed in 2 distinct terminal shell sessions : `);
console.log('-');
console.log(`[kubectl port-forward svc/${pulumiConfig.require("gravitee_apim_helm_release_name")}-ui ${pulumiConfig.require("kubectl_port_forward_mgmt_ui")}:8002`);
console.log('-');
console.log(`[kubectl port-forward svc/${pulumiConfig.require("gravitee_apim_helm_release_name")}-api ${pulumiConfig.require("kubectl_port_forward_mgmt_api")}:83`);
console.log('----');


/** example below [gravitee_apim_helm_release_name] = 'graviteeio-apim3x'
NAME                                TYPE           CLUSTER-IP       EXTERNAL-IP                                                               PORT(S)                                        AGE
service/graviteeio-apim3x-api       ClusterIP      172.20.182.220   <none>                                                                    83/TCP                                         3m52s
service/graviteeio-apim3x-gateway   ClusterIP      172.20.195.171   <none>                                                                    82/TCP                                         3m52s
service/graviteeio-apim3x-portal    ClusterIP      172.20.221.111   <none>                                                                    8003/TCP                                       3m52s
service/graviteeio-apim3x-ui        ClusterIP      172.20.115.81    <none>                                                                    8002/TCP                                       3m52s
service/kubernetes                  ClusterIP      172.20.0.1       <none>                                                                    443/TCP                                        16h
service/traefik                     LoadBalancer   172.20.253.133   a4aea71263fbc4c96bd2378b0677d778-1505901099.eu-west-1.elb.amazonaws.com   8000:31062/TCP,8080:30644/TCP,4443:32162/TCP   15h
*/



const gioVPC = new UnderlayVPC(`gravitee-serverless-vpc`, {
  externalMongoDBport: `${pulumiConfig.require("mongo_port")}`, /// Could be used used to set networking Security Groups rules (permissions to connect to Mongo), if using an external MongoDB inside the same VPC, but not in the EKS Fargate cluster
});

export const vpcId = gioVPC.vpc.id;
export const vpcIsolatedSubnetIds = gioVPC.vpc.isolatedSubnetIds;
export const vpcPrivateSubnetIds = gioVPC.vpc.privateSubnetIds;
export const vpcPublicSubnetIds = gioVPC.vpc.publicSubnetIds;
export const allVpcSubnetIds = gioVPC.vpc.getSubnetsIds;


const privSubnetIds = pulumi
  .all([gioVPC.vpc.privateSubnetIds])
  .apply(([privateSubnetIds]) => ([
    ...privateSubnetIds
  ]))
const allSubnetIds = pulumi
  .all([gioVPC.vpc.privateSubnetIds, gioVPC.vpc.publicSubnetIds])
  .apply(([privateSubnetIds, publicSubnetIds]) => ([
    ...privateSubnetIds,
    ...publicSubnetIds,
  ]))



  /**
   * ----------------------------------------------------------------------------------------------------------------
   * ----------------------------------------------------------------------------------------------------------------
   *  External Services First (not in Fargate Cluster) :
   *  AWS Document DB                 ==>>> External MongoDB for GRAVTIEE
   *  AWS Elasticsearch Services      ==>>> External Elasticsearch for GRAVTIEE
   * ----------------------------------------------------------------------------------------------------------------
   *  Or use existing external Elasticsearch and MongoDB services :
   *  Networking in this Pulumi defined AWS Vpc is setup so that outbound Access is
   *  allowed for External Databases Access.
   * ----------------------------------------------------------------------------------------------------------------
   * ----------------------------------------------------------------------------------------------------------------
   **/

  /*

  /// +++
  /// AWS Elasticsearch Services      ==>>> External Elasticsearch for GRAVTIEE

  /// export const GRAVITEE_MONGO_DBNAME: string = 'gravitee'; /// sets the DB NAME for gravitee APIM /// Create MongoDB ? not necessary, gravitee will do it ?
  const docdbSubnetGroup = new aws.rds.SubnetGroup("docdb-subnetgroup", {
      subnetIds: gioVPC.vpc.publicSubnetIds,
      tags: {
          Name: "My DB subnet group",
      },
  });
  export const documentdb = new AWSDocumentDb(`gio-documentdb-${environment}`, {
   // -- //
   // A reference on the created Kubernetes Cluster with EKS
   // https://github.com/pulumi/pulumi-eks#deploying-a-workload
   /// graviteeMongoDBname: `${GRAVITEE_MONGO_DBNAME}`,/// Create MongoDB ? not necessary, gravitee will do it ?
   backupRetentionPeriod: 5,
   engine: 'docdb',
   preferredBackupWindow: "04:00-06:00",
   skipFinalSnapshot: true,
   clusterIdentifier: "gravitee-docdb", ///  only lowercase alphanumeric characters and hyphens allowed in "cluster_identifier" accepted by AWS
   vpcSecurityGroupIds: [gioVPC.documentdbSecGroup.id], /// [gioVPC.documentdbSecGroup] defnies Inbound Network Permissions
   // vpcSecurityGroupIds: []
   vpcDocDbSubnetGroup: docdbSubnetGroup
  });

  export const EXTERNAL_MONGODB_ENDPOINT = documentdb.endpoint.apply(JSON.stringify);
  export const EXTERNAL_MONGODB_BACKUP_RETENTION_PERIOD = documentdb.backupRetentionPeriod;
  export const EXTERNAL_MONGODB_CLUSTER_IDENTIFIER = documentdb.clusterIdentifier; /// e.g. "graviteedocdb-cluster"
  export const EXTERNAL_MONGODB_ENGINE = documentdb.engine;
  export const EXTERNAL_MONGODB_SKIPFINALSNAPSHOT = documentdb.skipFinalSnapshot;
  export const EXTERNAL_MONGODB_PREFERREDBACKUPWINDOW = documentdb.preferredBackupWindow;

  */


/**
 * ----------------------------------------------------------------------------------------------------------------
 * ----------------------------------------------------------------------------------------------------------------
 *  Kubernetes EKS cluster
 * ----------------------------------------------------------------------------------------------------------------
 * ----------------------------------------------------------------------------------------------------------------
 **/
 //// see https://thenewstack.io/how-aws-fargate-turned-amazon-eks-into-serverless-container-platform/ : Difference between ECS and Fargate on EKS

// Create the EKS cluster itself with Fargate enabled.
/// only one difference will be tested : [nodeAssociatePublicIpAddress] left to default
const gioEKSCluster: eks.Cluster = new eks.Cluster(`gioEKSCluster`, {
    providerCredentialOpts: { profileName: aws.config.profile },
    fargate: true,
    vpcId: gioVPC.vpc.id,
    /// privateSubnetIds: vpcPrivateSubnetIds,
    /// instanceRole: role0,
    ///privateSubnetIds: vpc.privateSubnetIds,
    subnetIds: allSubnetIds, /// I personally added this one as less restrictive, but it's either [subnetIds] OR [privateSubnetIds], either one of them, it's a choice
    nodeAssociatePublicIpAddress: false, ///
    /// createOidcProvider: true /// very imlportant for AWS User Management see [https://www.pulumi.com/blog/eks-oidc/] and [https://aws.amazon.com/blogs/containers/using-alb-ingress-controller-with-amazon-eks-on-fargate/]
});

// Export the cluster's kubeconfig.
export const kubeconfig = gioEKSCluster.kubeconfig;
// a reference on the pulumi k8s provider, to pass on to modules deploying to kubernetes cluster
const k8sProvider = new k8s.Provider('k8s', {
  kubeconfig: gioEKSCluster.kubeconfig.apply(JSON.stringify),
});






/// ------------------------------------------
/// Explicitly Create Fargate Profile
/// Why?
/// Because we need a fargate
/// profile, inside the same namespace where
/// the apps we want to run on fargate live
/// otherwise, Fargate Scheduler won't "see"
/// the apps we kubectl label for
/// fargate scheduler
/// In the following AWS doc, you will see that
/// multiple (at least 2) Fargate Profiles can be created
/// in the same Cluster :
/// https://docs.aws.amazon.com/eks/latest/userguide/fargate-getting-started.html :
/// ------------------------------------------
/// https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/aws/eks/#example-usage-1
/// https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/aws/eks/#FargateProfile
/// ---

/// ---
/// Fargate Profile and IAM Role
/// See https://www.pulumi.com/docs/reference/pkg/aws/eks/fargateprofile/#example-usage
///


const podsAWSRole = new aws.iam.Role("podsAWSRole", {assumeRolePolicy: JSON.stringify({
    Statement: [{
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
            Service: "eks-fargate-pods.amazonaws.com",
        },
    }]
})});

const example_AmazonEKSFargatePodExecutionRolePolicyAttachment = new aws.iam.RolePolicyAttachment("example-AmazonEKSFargatePodExecutionRolePolicy", {
    policyArn: "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy",
    role: podsAWSRole.name,
});


/// This name will be used to [LABEL] [K8S DEPLOYMENTS] with [eks.amazonaws.com/fargate-profile: myfargateprofile]
export const gioFargateProfileName: string = `${pulumiConfig.require("desired_fargate_profile_name")}`;


let fargateTipMsg: string =  "For any application deployed as a [kind: Service], you can label it for fargate scheduler like this : ";

let fargateTipCommand =  " kubectl label svc whoami eks.amazonaws.com/fargate-profile=" + `${gioFargateProfileName}` +" --overwrite ";


// kubectl label svc whoami 'gravitee.io/gravitee_team_rocks'='doesntit' --overwrite
export const gioFargateProfileTip: string = `${fargateTipMsg}`;
export const gioFargateProfileTipCommand: string = `${fargateTipCommand}`;



// Create a Kubernetes Namespace ? doesn't help with providing namespace
/// const ns = new k8s.core.v1.Namespace(config.require("k8s_namespace"), {}, { provider: k8sProvider });

/// see https://thenewstack.io/how-aws-fargate-turned-amazon-eks-into-serverless-container-platform/ : Difference between ECS and Fargate on EKS
export const fprofile = new aws.eks.FargateProfile(`${gioFargateProfileName}`, {
    clusterName: gioEKSCluster.eksCluster.name,
    podExecutionRoleArn: podsAWSRole.arn,
    subnetIds: privSubnetIds, /// [allSubnetIds] contains public Subnets, And Fargate does not tolerate that, an error like this would be thrown:  : [ error: error creating EKS Fargate Profile (gioEKSCluster-eksCluster-e8f222c:giofargateprofile-a242243): InvalidParameterException: Subnet subnet-0388a5e2e3dc49212 provided in Fargate Profile is not a private subnet]
    selectors: [
    {namespace: 'kube-system'},
    {
      namespace: `${pulumiConfig.require("k8s_namespace")}`, /// Le voilà le pods selector pour le fargate profile, on oublie le namespace, on uitlisera un label, et bingo label
      labels: {
        'graviteeio/serverless': 'fargate'
      }
    }]
});
// fprofile.fargateProfileName
// fprofile.status
console.log(`Fargate Profile name is : [${fprofile.fargateProfileName.apply(JSON.stringify)}]`);
console.log(`Fargate Profile status is : [${fprofile.status.apply(JSON.stringify)}]`);


/// https://towardsdatascience.com/how-to-configure-iam-roles-for-fargate-tasks-on-aws-76ad54f11314

/// ABOUT [privateSubnetIds] and Fargate Profile :
///
///  Even though the Fargate data plane runs in a hidden, private VPC, a subnet from the customer VPC is needed to route the inbound and outbound traffic.
///






/**
 * ----------------------------------------------------------------------------------------------------------------
 * ----------------------------------------------------------------------------------------------------------------
 * ALB Ingress Controller (deplpoyed as HELM CHART)
 * ----------------------------------------------------------------------------------------------------------------
 * ----------------------------------------------------------------------------------------------------------------
 **/

 export const ALBIngresController = new AwsALB(`albIngressController`, {
   cluster: gioEKSCluster,
   pulumiConfig: pulumiConfig
 });


 /**
  * ----------------------------------------------------------------------------------------------------------------
  * ----------------------------------------------------------------------------------------------------------------
  *  Optional - Traefik Reverse Proxy (Not acting as Kubernetes Ingress Controller)
  * ----------------------------------------------------------------------------------------------------------------
  * ----------------------------------------------------------------------------------------------------------------
  **/

/*
 const gioReverseProxy = new TraefiKube(`gio-traefik`, {
   scaleUpOrder: 61,
   helmChartVersion: "10.2.3", // must comply to semver, use linter inside package.json scripts section
   // -- //
   // A reference on the created Kubernetes Cluster with EKS
   // https://github.com/pulumi/pulumi-eks#deploying-a-workload
   eksCluster: gioEKSCluster,
   pulumiConfig: pulumiConfig
 });

*/



 // pulumi stack output -j
 // export const ips = gioIngressController.IPs

 /**
  * ----------------------------------------------------------------------------------------------------------------
  * ----------------------------------------------------------------------------------------------------------------
  *  Kubernetes External DNS : we will consider this when finished with all other components
  * ----------------------------------------------------------------------------------------------------------------
  * ----------------------------------------------------------------------------------------------------------------
  **/





/////======>>>>>>> LEAVING GRAVTIEE ASIDE FOR TEST PURPOSES WILL BRING BACK AFTER

 const gioApiGateway = new GraviteeAPIMKube(`gravitee-apim-kube`, {
   // -- //
   // A reference on the created Kubernetes Cluster with EKS
   // https://github.com/pulumi/pulumi-eks#deploying-a-workload
   eksCluster: gioEKSCluster,
   pulumiConfig: pulumiConfig,
   baseNomsDomainesGraviteeAPIM: "api", // then Gravitee APIM Gateway (The API Gateway) will be exposed at https://api.
   fargateProfile: fprofile
 });
