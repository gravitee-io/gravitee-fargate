import * as pulumi from '@pulumi/pulumi';

/**
 *
 * -------------------------------------------------------------------
 *   Dépendances issues du template de projet @kubernetes-typescript
 * -------------------------------------------------------------------
 *
 **/
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";

/** -----
* VOILA COMMENT RECUPERER LA KUBECONFIG DU CLUSTER CREE AVEC EKS :
* https://github.com/alexbechmann/refract-cms/blob/46c69896a3b102f7ef7ead7bde9541f6125ca66b/pulumi/index.ts#L11
*
*
*
**/
import * as eks from "@pulumi/eks";


export interface MongoKubeArgs {
  scaleUpOrder: number;
  helmChartVersion: string; // must comply to semver, use linter inside package.json scripts section

  // -- //
  // A reference on the created Kubernetes Cluster with EKS
  // https://github.com/pulumi/pulumi-eks#deploying-a-workload
  eksCluster: eks.Cluster;
  mongoHelmDeploymentName: string;
  /// example : gravitee-am.mycompany.io
  /// nomDomaineGraviteeAM: string;
  /// example : gravitee-apim.mycompany.io
  ///nomDomaineGraviteeAPIM: string;
}

export class MongoKube extends pulumi.ComponentResource {
  // ------------------ //
  // ---- ASPECT 1, NIVEAU CLASSE : encapusler ---- //
  // ------------------ //

  // --- Au niveau de la classe , on déclare l'attribut de classe :
  //
  // 'readonly' (encapsulation) : pas de set public, uniquement un get, accessible du consommateur
  //
  // Ici, la valeur promise, est une chaîne de caractère : pulumi.Output<string>
  // Si on avait voulu un type nombre entier, au lieu d'une chaîne de caractère : pulumi.Output<number>
  // etc...
  // ---------------------------------
  // L'ordre du scale up Kubernetes pour ce déploiement Gravitee
  // (Combien de desired replicas ?)
  // --
  // La valeur de ce paramètre doit être fournie au constructeur, via le [MongoKubeArgs]
  // En Java on aurait eut : 'private String monAttribut; // plus les méthodes get set public et private resp.'
  // public readonly desiredReplicaNumber: pulumi.Output<number>
  public readonly desiredReplicaNumber: number


  // --
  // une fois le déploiement réalisé, le nombre de réplica est lu par 'kubectl describe gravitee', et le replicaNumber retourné est affecté comme valeur de cet attribut.
  /// public zeroTimeReplicaNumber: pulumi.Output<number>
  public zeroTimeReplicaNumber: number



  // The Pulumi Key to retrieve the secret from ENV
  public readonly gitlabRegistrySecretPulumiKey: string

  public readonly eksCluster: eks.Cluster

  // ---------------------------------
  // Helm Chart
  // --
  // MongoDB Replicaset is provisioned using https://hub.helm.sh/charts/stable/mongodb-replicaset
  //
  // --
  //
  // helmRepoID: string,
  // helmRepoURL: string,
  // chartVersion: string
  // chartID: string
  //
  public readonly helmRepoID: string
  public readonly helmRepoURL: string
  public readonly helmChartVersion: string // must comply to semver, use linter inside package.json scripts section

  ///
  /// A domain name just for internal K8S networking, not outside
  /// The network name for Gravtiee to hit MongoDB
  ///
  public readonly mongoHelmDeploymentName: string
  /// example : gravitee-am.mycompany.io
  /// public readonly nomDomaineGraviteeAM: string;
  /// example : gravitee-apim.mycompany.io
  /// public readonly nomDomaineGraviteeAPIM: string;

  constructor (
     // Ces trois arguments seront attendus par le constructeur de
     // la classe Mère :  pulumi.ComponentResource
    name: string,
    args: MongoKubeArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super(`${pulumi.getProject()}:MongoKube`, name, {}, opts)
    /**
     * Tout votre code Pulumi
     **/

    // let valeurScaleUpOrder = new pulumi.Output<number>(args.scaleUpOrder);

    // Utilisé pour provisionner Gravitee
    this.desiredReplicaNumber = args.scaleUpOrder;
    this.helmChartVersion = args.helmChartVersion;
    this.eksCluster = args.eksCluster;

    // valeur par défaut :
    // Cette valeur devra être fournie par la méthode [deployerGravitee()]
    /// let valeurZeroTimeReplicaNumber = pulumi.output(0);

    // let valeurZeroTimeReplicaNumber = new pulumi.OutputInstance(0);
    this.zeroTimeReplicaNumber = 2;

    this.gitlabRegistrySecretPulumiKey = "gitlabRegistrySecret-ro";

    // ---------------------------------
    // Helm Charts common properties
    // --
    // Initialization : helm repo add graviteeio https://helm.gravitee.io
    // --
    // cf. la méthode [ executerUnHelmChart () {} ]
    // --
    this.helmRepoID = "graviteeio";
    this.helmRepoURL = "https://helm.gravitee.io";
    // this.helmChartVersion = "latest";

    // this.nomDomaineGraviteeAM = args.nomDomaineGraviteeAM
    /// this.nomDomaineGraviteeAPIM = args.nomDomaineGraviteeAPIM
    this.mongoHelmDeploymentName = args.mongoHelmDeploymentName
    this.eksCluster = args.eksCluster

    /* MONGODB REPLICA SET */
    /// trick about the provider : https://github.com/pulumi/pulumi-kubernetes/issues/1032
    ///
    const kubeconfig = this.eksCluster.kubeconfig.apply(JSON.stringify)
    const k8sProvider = new k8s.Provider(`${name}-k8s-provider`, {kubeconfig: kubeconfig});

    /*
    const k8sProvider = new k8s.Provider(`${name}-k8s-provider`, {
      kubeconfig: this.eksCluster.kubeconfig,
    }, { parent: this })
    */

    // https://hub.helm.sh/charts/stable/mongodb-replicaset
    const repo = 'https://kubernetes-charts.storage.googleapis.com'

    // #!/bin/bash  ${MONGO_HELM_DEPLOYMENT_NAME}-mongodb-replicaset-client.${K8S_NAMESPACE}.svc.cluster.local
    const knamespace = 'default'
    const mongodbHost = this.mongoHelmDeploymentName + `-mongodb-replicaset-client.${knamespace}.svc.cluster.local`;
    // helm repo add stable https://kubernetes-charts.storage.googleapis.com/
    // helm install --name my-release stable/mongodb-replicaset
    const $am = new k8s.helm.v3.Chart(this.mongoHelmDeploymentName, {
      fetchOpts: { repo },
      version: this.helmChartVersion,
      chart: 'mongodb-replicaset',
    ///}, { parent: this });
    ///}, { parent: this, provider: k8sProvider });
    }, { parent: this, provider: k8sProvider });




  }

  /**
  *
  * -----------------------------------------------------------------------------------------------
  * Cette méthode exécute le déploiement de Gravitee, mais pour l'instant son corps est
  * exécuté dans le constructeur, c'est nécessair, mais je ne saurais
  * expliquer pourquoi pour l'instant
  * -----------------------------------------------------------------------------------------------
  * @mongoHelmDeploymentName :  le nom du helm chart qui a déployé le MongoDB Replicaset, base de données de Gravitee
  * `${MONGO_HELM_DEPLOYMENT_NAME}-mongodb-replicaset-client.svc.cluster.local`
  *
  * @knamespace : the Kubernetes namespace in which the  mongodb replicaset is deployed
  * @helmChartVersion : ccc
  **/
   public deployerMongoDBReplicaSet (mongoHelmDeploymentName: string, helmChartVersion: string) {
     /* GRAVITEE */
     /// trick about the provider : https://github.com/pulumi/pulumi-kubernetes/issues/1032
     ///
     const kubeconfig = this.eksCluster.kubeconfig.apply(JSON.stringify)
     const k8sProvider = new k8s.Provider(`${name}-k8s-provider`, {kubeconfig: kubeconfig});

     /*
     const k8sProvider = new k8s.Provider(`${name}-k8s-provider`, {
       kubeconfig: this.eksCluster.kubeconfig,
     }, { parent: this })
     */

     const repo = 'https://kubernetes-charts.storage.googleapis.com'
     const knamespace='default'
     // #!/bin/bash  ${MONGO_HELM_DEPLOYMENT_NAME}-mongodb-replicaset-client.${K8S_NAMESPACE}.svc.cluster.local
     const mongodbHost = this.mongoHelmDeploymentName + `-mongodb-replicaset-client.${knamespace}.svc.cluster.local`;

     // helm repo add stable https://kubernetes-charts.storage.googleapis.com/
     // helm install --name my-release stable/mongodb-replicaset
     const $am = new k8s.helm.v3.Chart(`${mongoHelmDeploymentName}`, {
       fetchOpts: { repo },
       version: this.helmChartVersion,
       chart: 'stable/mongodb-replicaset',
       transformations: [
         (obj: any) => { // https://cloud.google.com/kubernetes-engine/docs/deprecations/apis-1-16 : applies to [daemonsets], [staefulsets], and [deployments]
           if (obj.kind === 'Deployment') {    // https://github.com/gravitee-io/issues/issues/2835  // concerne Gravitee, mais pour le ReplicaSet Mongo Aussi .
             obj.apiVersion = 'apps/v1'        // au lieu de [extensions/v1beta1], [apps/v1beta1], ou [apps/v1beta2] dans les fichiers de "kind" deployment
           }; // warning: apps/v1beta2/StatefulSet is deprecated by apps/v1/StatefulSet and not supported by Kubernetes v1.16+ clusters.
           if (obj.kind === 'StatefulSet') {    // https://github.com/gravitee-io/issues/issues/2835  // concerne Gravitee, mais j'ai vu le warning pour le ReplicaSet Mongo Aussi :
                                                // // warning: apps/v1beta2/StatefulSet is deprecated by apps/v1/StatefulSet and not supported by Kubernetes v1.16+ clusters.
             obj.apiVersion = 'apps/v1'          // au lieu de [extensions/v1beta1], [apps/v1beta1], ou [apps/v1beta2] dans les fichiers de "kind" statefulset,
           };
           if (obj.kind === 'Daemonset') {    // https://github.com/gravitee-io/issues/issues/2835  // concerne Gravitee, mais j'ai vu le warning pour le ReplicaSet Mongo Aussi :
                                                // // warning: apps/v1beta2/StatefulSet is deprecated by apps/v1/StatefulSet and not supported by Kubernetes v1.16+ clusters.
             obj.apiVersion = 'apps/v1'          // au lieu de [extensions/v1beta1], [apps/v1beta1], ou [apps/v1beta2] dans les fichiers de "kind" statefulset,
           };

           if (obj.kind === 'Ingress') {
             obj.apiVersion = 'networking.k8s.io/v1' // https://github.com/gravitee-io/issues/issues/2835
                                               // [networking.k8s.io/v1] au lieu de [extensions/v1beta1]
                                               // Migrate to use the [policy/v1beta1 API], available since v1.10. Existing persisted data can be retrieved/updated via the new version.
           }                                   // NetworkPolicy in the extensions/v1beta1 API version is no longer served
         }
       ]
     ///}, { parent: this });
     ///}, { parent: this, provider: k8sProvider });
     }, { parent: this, provider: k8sProvider });


     /**
      * --------------------------------------------------------------------------------------------
      * pour le 'k8sProvider' c'est une référence sur le
      * cluster, qui permet d'utiliser la KUBECONFIG
      * --------------------------------------------------------------------------------------------
      * https://github.com/pulumi/pulumi-kubernetes/blob/af7af1cb9a827056f8e98fcecd77310abd8c6d55/tests/integration/istio/step1/istio.ts#L52
      * --------------------------------------------------------------------------------------------
      **/

     //// -------++-------++-------++-------++-------++------- ////
     //// -------++-------++-------++-------++-------++------- ////
     //// -------++-------++-------++-------++-------++------- ////
     //// -------++-------++-------++-------++-------++------- ////
     //// -------++-------++-------++-------++-------++------- ////
     //// -------++---   TODO DU MATAÎNG    ////
     //// -------++---    - faire le bilan des values param de conf. des Charts, cf. ccc    ////
     //// -------++---    - CODE PULUMI MONGODB : https://github.com/pulumi/pulumi-mongodbatlas/tree/master/examples
     //// -------++-------++-------++-------++-------++------- ////
     //// -------++-------++-------++-------++-------++------- ////
     //// -------++-------++-------++-------++-------++------- ////
     //// -------++-------++-------++-------++-------++------- ////
     //// -------++-------++-------++-------++-------++------- ////
     //// -------++-------++-------++-------++-------++------- ////

     /*
     const $apim = new k8s.helm.v3.Chart(`${name}-apim`, {
       fetchOpts: { repo },
       version: '1.29.3',
       chart: 'apim',
       values: {
         // ... all the chart config values go here
       },
     }, { parent: this, provider: k8sProvider });
     */
     /*
     const $apim = new k8s.helm.v3.Chart(`${name}-apim`, {
       fetchOpts: { repo },
       version: '1.29.3', // https://github.com/gravitee-io/helm-charts/blob/6089b683558aa268cc8ec51b3abe3ed4b8636f37/apim/Chart.yaml#L3
       chart: 'apim',
       values: {
         // ... all the chart config values go here
       },
       transformations: [
         (obj: any) => {
           if (obj.kind === 'deployment') {    // https://github.com/gravitee-io/issues/issues/2835  // concerne l'APIM uniquement, apparrement.
             obj.apiVersion = 'apps/v1'        // au lieu de [extensions/v1beta1], [apps/v1beta1], ou [apps/v1beta2] dans les fichiers de "kind" deployment
           };
           if (obj.kind === 'ingress') {
             obj.apiVersion = 'policy/v1beta1' // https://github.com/gravitee-io/issues/issues/2835
                                               // [policy/v1beta1 API] au lieu de [extensions/v1beta1]
                                               // Migrate to use the [policy/v1beta1 API], available since v1.10. Existing persisted data can be retrieved/updated via the new version.
           }                                   // NetworkPolicy in the extensions/v1beta1 API version is no longer served
         }
       ]
     // }, { parent: this });
     // }, { parent: this, provider: this.eksCluster });
     }, { parent: this, provider: this.eksCluster.kubeconfig });

     */

     /**
      * --------------------------------------------------------------------------------------------
      * pour le 'k8sProvider' c'est une référence sur le
      * cluster, qui permet d'utiliser la KUBECONFIG
      * --------------------------------------------------------------------------------------------
      * https://github.com/pulumi/pulumi-kubernetes/blob/af7af1cb9a827056f8e98fcecd77310abd8c6d55/tests/integration/istio/step1/istio.ts#L52
      * --------------------------------------------------------------------------------------------
      **/


   }
   /**
    * Cette métode exécute l'opération de création du Secret Kubernetes
    * destiné à protéger la valeur du token gitlab utilisé pour docker pull depuis le cluster Kubernetes.
    * En l'utilisant pour s'authentifier, on aura le droit de faire un "Pull" (seule chose nécessaire).
    * --
    * Elle devra être externalisée dns un autre module : on ne va pas créer un secret à chaque déploiement!
    **/
    public creerK8SSecretGitlabDockerRegistry () {
      this.eksCluster.kubeconfig.apply(cluster => {
       // pulumi.log.info(" Ah oui la kubeconfig : " + cluster.kubeconfig.toString());

       const valueRegistrySecret = new k8s.core.v1.Secret(this.gitlabRegistrySecretPulumiKey, {
         metadata: {
           name: this.gitlabRegistrySecretPulumiKey,
           namespace: 'default',
         },
         stringData: {
           '.dockerconfigjson': JSON.stringify({
             auths: {
               'registry.gitlab.com': {
                 username: 'giobot_operator',
                 password: 'motdepasse',
               },
             },
           }),
         },
         type: 'kubernetes.io/dockerconfigjson',
       }, { additionalSecretOutputs: ['stringData'], provider: cluster.kubeconfig });
       // le provider ici, est lié à la KUBECONFIG du cluster créé avec AWS / EKS
     });


      /**
       *
       * Exemple correct de création des secrets Kubernetes :
       * https://github.com/lbrlabs/pulumi-drone-runner/blob/dd52eaeb6965d4fdd9e68d53acbdf8135c2711e7/index.ts#L27
       **/


    }

}
