import * as pulumi from '@pulumi/pulumi';
import * as path from "path";

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


export interface GraviteeKubeArgs {
  scaleUpOrder: number;
  graviteeVersion: string; // must comply to semver, use linter inside package.json scripts section

  // -- //
  // A reference on the created Kubernetes Cluster with EKS
  // https://github.com/pulumi/pulumi-eks#deploying-a-workload
  eksCluster: eks.Cluster;
  mongoHelmDeploymentName: string;
  /// example : gravitee-am
  baseNomsDomainesGraviteeAM: string;
  /// example : gravitee-apim
  baseNomsDomainesGraviteeAPIM: string;
  /// example 4443
  ingressControllerTLSPort: string;
}

export class GraviteeKube extends pulumi.ComponentResource {
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
  // La valeur de ce paramètre doit être fournie au constructeur, via le [GraviteeKubeArgs]
  // En Java on aurait eut : 'private String monAttribut; // plus les méthodes get set public et private resp.'
  // public readonly desiredReplicaNumber: pulumi.Output<number>
  public readonly desiredReplicaNumber: number

  public readonly desiredGraviteeVersion: string // must comply to semver, use linter inside package.json scripts section
  public readonly ingressControllerTLSPort: string // the string must be parseable as a valid port numbrer for the cloud provider. Like [443] or [4443]
  // --
  // une fois le déploiement réalisé, le nombre de réplica est lu par 'kubectl describe gravitee', et le replicaNumber retourné est affecté comme valeur de cet attribut.
  /// public zeroTimeReplicaNumber: pulumi.Output<number>
  public zeroTimeReplicaNumber: number



  // The Pulumi Key to retrieve the secret from ENV
  public readonly gitlabRegistrySecretPulumiKey: string

  public readonly eksCluster: eks.Cluster

  // ---------------------------------
  // Helm Charts common properties
  // --
  // Gravitee is provisioned through 6 different components.
  // So 6 Helm Charts for all of them ?
  // No, the gravitee team provides 2 helm charts which provision 3 components each :
  //
  //   ( partie "AM")   https://github.com/gravitee-io/helm-charts/tree/master/am#components
  //   ( partie "APIM")   https://github.com/gravitee-io/helm-charts/tree/master/apim#components
  //
  // --
  //
  // helmRepoID: string,
  // helmRepoURL: string,
  // chartVersion: string,  => this one varies across Charts for Gravitee, but this will hold as the default version, like a "latest"
  // chartID: string  => this one varies across Charts for Gravitee, so not a value shared between all of them (NOT OPERATIONAL YET, LEFT UNUSED)
  //
  public readonly helmRepoID: string
  public readonly helmRepoURL: string
  public readonly chartVersion: string
  ///
  /// A domain name just for internal K8S networking, not outside
  /// The network name for Gravtiee to hit MongoDB
  ///
  public readonly mongoHelmDeploymentName: string
  /// example : gravitee-am.mycompany.io
  public readonly baseNomsDomainesGraviteeAM: string;
  /// example : gravitee-apim.mycompany.io
  public readonly baseNomsDomainesGraviteeAPIM: string;

  constructor (
     // Ces trois arguments seront attendus par le constructeur de
     // la classe Mère :  pulumi.ComponentResource
    name: string,
    args: GraviteeKubeArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super(`${pulumi.getProject()}:GraviteeKube`, name, {}, opts)

    // Utilisé pour provisionner Gravitee
    this.desiredReplicaNumber = args.scaleUpOrder;
    this.desiredGraviteeVersion = args.graviteeVersion;
    this.eksCluster = args.eksCluster;
    this.ingressControllerTLSPort = args.ingressControllerTLSPort;
    this.baseNomsDomainesGraviteeAM = args.baseNomsDomainesGraviteeAM;
    this.baseNomsDomainesGraviteeAPIM = args.baseNomsDomainesGraviteeAPIM;

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
    this.chartVersion = "latest";

    this.baseNomsDomainesGraviteeAM = args.baseNomsDomainesGraviteeAM
    this.baseNomsDomainesGraviteeAPIM = args.baseNomsDomainesGraviteeAPIM
    this.mongoHelmDeploymentName = args.mongoHelmDeploymentName
    this.eksCluster = args.eksCluster

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


    const repo = 'https://helm.gravitee.io'

    // ${MONGO_HELM_DEPLOYMENT_NAME}-mongodb-replicaset-client.${K8S_NAMESPACE}.svc.cluster.local
    // The Kunbernetes namespace where Gravtiee will live
    const knamespace = 'default'
    const mongodbHost = this.mongoHelmDeploymentName + `-mongodb-replicaset-client.${knamespace}.svc.cluster.local`;


    const $am = new k8s.helm.v3.Chart(`gravitee-am`, {
      fetchOpts: { repo },
      version: '1.0.1',
      chart: 'am',
      // -----
      // Interpolations du values.yaml :
      // -
      // 1. toutes les occurrences de 'am.example.com', dans le  'gravitee-helm/am/values.yaml'
      ///   C'est à dire :
      //    => 'api.ingress.hosts[0].host' : `${nomdomaineAM}`,
      //    => 'api.ingress.tls.host' : `${nomdomaineAM}`
      //    => 'api.http.services.core.http.host' : `${nomdomaineAM}`
      //    => 'api.ingress.tls.host' : `${nomdomaineAM}`
      //    => 'api.ingress.tls.host' : `${nomdomaineAM}`
      // 2. Il faut aussi apporter les corrections de "apiVersion" du Chart officiel Gravitee Helm Chart
      // 3. L'unqiue paramètre, qui lie le cluster MongoDB à toutes les occurrences de 'am.example.com', dans le  'gravitee-helm/am/values.yaml'
      ///   C'est à dire :
      // sed -i "s#dbhost: ${WRONG_GIOONFARGATE_GRAVITEE_MONGO_HOST}#dbhost: ${GIOONFARGATE_GRAVITEE_MONGO_HOST}#g" gravitee-helm/am/values.yaml
      // -----
      // ok, pour se débarasser des ingress utilsier les "enabling options", pour ne plsu avoir besoin de "supprimer les définitons ingress à la volée" :
      // * `api.http.services.core.ingress.enabled` à `enabled: 'false'` : (`Ingress` "à l'ancienne" pour des fonctionnalités dites "core" du composant `Gravitee AM API`, je n'ai aucune idée de ce dont il s'aigt pour l'instant. L' `Ingress` est de toute façon par défaut à  'false', je vais tout de même lui affecter cette valeur explicitement pour montrer la globalité de la désactivation de tous les `Ingress`, dans la recette `pulumi` .
      // * `api.ingress.enabled` à `enabled: 'false'` (`Ingress` "à l'ancienne" pour le composant `Gravitee AM API`, sera remplacé par une `containous.traefik.io/IngressRoute:v1beta1`... )
      // * `gateway.ingress.enabled` à `enabled: 'false'` (`Ingress` "à l'ancienne" pour le composant `Gravitee AM Gateway`, sera remplacé par une `containous.traefik.io/IngressRoute:v1beta1`... )
      // * `ui.ingress.enabled` à `enabled: 'false'` (`Ingress` "à l'ancienne" pour le composant `Gravitee AM Web UI`, sera remplacé par une `containous.traefik.io/IngressRoute:v1beta1`... )
      //
      // Soit 4 désactivations explicites en tout.
      // -----
      values: {
        /* mongodb-replicaset: {
          persistentVolume : {
            size: `1Gi`
          }
        },*/
        mongo: {
          dbhost: `${mongodbHost}`
        },
        api: {
          /* gateway: {
            url: this.baseNomsDomainesGraviteeAM
          },*/
          ingress: {
            enabled: false,
            hosts: [
              // 'api.ingress.hosts[0].host' : "d471b47a0a0a9fa0685ffb85d47d8889.sk1.eu-west-1.eks.amazonaws.com",
              // # [JBL]-[api.ingress.hosts[0].host : `${baseNomsDomainesGraviteeAM}`]
              /// { host: this.baseNomsDomainesGraviteeAM }
              /// { host: this.baseNomsDomainesGraviteeAM + '-api.mycompany.io:' +`${this.ingressControllerTLSPort}` } /// [api.ingress.hosts[0].host] donne une valeur à [MGMT_API_URL] pour le deployment de la Web UI de GRavitee AM (afin que la Web UI "tape" sur l'API Gravitee AM), cf. https://github.com/gravitee-io/helm-charts/blob/da34cd488e99a81e88e0b795e9b3f2af1d41a49d/am/templates/ui/ui-deployment.yaml#L49  et ce même quand le Ingress est configuré [enabled : 'false']
              { host: this.baseNomsDomainesGraviteeAM + '-ui.mycompany.io:' +`${this.ingressControllerTLSPort}` } /// [api.ingress.hosts[0].host] donne une valeur à [MGMT_API_URL] pour le deployment de la Web UI de Gravitee AM (afin que la Web UI "tape" sur l'API Gravitee AM), cf. https://github.com/gravitee-io/helm-charts/blob/da34cd488e99a81e88e0b795e9b3f2af1d41a49d/am/templates/ui/ui-deployment.yaml#L49  et ce même quand le Ingress est configuré [enabled : 'false']
              /// Host(`gravitee-am-ui.mycompany.io`) && PathPrefix(`/management`)
            ],
            tls: [ // not used, because ingress.enabled : 'false'
              // 'api.ingress.tls[0].hosts[0]' : n'est utilisé que dasn les templates d'Ingress, dans le Helm Charts
              ///
              /// { host: this.baseNomsDomainesGraviteeAM }
              /// { host: this.baseNomsDomainesGraviteeAM + '-api.mycompany.io:' +`${this.ingressControllerTLSPort}` }
              { host: this.baseNomsDomainesGraviteeAM + '-ui.mycompany.io:' +`${this.ingressControllerTLSPort}` + '/management' }
              /// Host(`gravitee-am-ui.mycompany.io`) && PathPrefix(`/management`)
            ]
          },
          http: {
              services: {
                core: {
                  http:
                     {// # [JBL]-[api.http.services.core.http.host]
                      // host: this.baseNomsDomainesGraviteeAM
                      // host: `gravitee-am.haddock.io`
                      host: `0.0.0.0`
                     },
                 ingress: {
                   enabled: false,
                   hosts:
                     {// # [JBL]-[api.http.services.core.ingress.hosts[0]] // utilisé pour exposer "The Gravitee AM Technical API"
                       host: this.baseNomsDomainesGraviteeAM + '-api.mycompany.io:' +`${this.ingressControllerTLSPort}` + `/technical-api`
                     }
                 }
                }
              }
           }
        },
        gateway: {
          ingress: {// # [JBL]-[gateway.ingress.hosts[0] : this.baseNomsDomainesGraviteeAM]
            enabled: false,
            hosts: [ this.baseNomsDomainesGraviteeAM + '-gw.mycompany.io:' +`${this.ingressControllerTLSPort}` ],
            tls: [
              {// # [JBL]-[gateway.ingress.tls[0].hosts[0] : this.baseNomsDomainesGraviteeAM]
                hosts: [ this.baseNomsDomainesGraviteeAM + '-gw.mycompany.io:' +`${this.ingressControllerTLSPort}` ]
              }
            ]
          }
        },
       ui: {
         ingress: {
           enabled: false,
           // # [JBL]-[ui.ingress.hosts[0] : this.baseNomsDomainesGraviteeAM] ///   + '/am/ui'
           hosts: [ this.baseNomsDomainesGraviteeAM + '-ui.mycompany.io:' +`${this.ingressControllerTLSPort}`    ],
           // # [JBL]-[ui.ingress.tls[0].hosts[0] : this.baseNomsDomainesGraviteeAM]
           tls: [ // non-utilisé car {enabled : 'false'} pour l'Ingress /// mais configuré, au cs où il soit utilisé d'autre part, comme d'autres ci-dessus
             { hosts: [ this.baseNomsDomainesGraviteeAM + '-ui.mycompany.io:' +`${this.ingressControllerTLSPort}` ] }
           ]
         }
       }
      },
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

          if (obj.kind === 'Ingress') {// not yet for ingresses :
            // obj.apiVersion = 'networking.k8s.io/v1' // https://github.com/gravitee-io/issues/issues/2835
                                              // [networking.k8s.io/v1] au lieu de [extensions/v1beta1]
                                              // Migrate to use the [policy/v1beta1 API], available since v1.10. Existing persisted data can be retrieved/updated via the new version.
          }                                   // NetworkPolicy in the extensions/v1beta1 API version is no longer served
        }
      ]
    ///}, { parent: this });
    ///}, { parent: this, provider: k8sProvider });
    }, { parent: this, provider: k8sProvider });


    /// NOW DEPLOYING INGRESS ROUTES FOR GRAVITEE AM
    /// const kubeconfig = this.eksCluster.kubeconfig.apply(JSON.stringify)
    /// const k8sProvider = new k8s.Provider(`${name}-k8s-provider`, {kubeconfig: kubeconfig});

    const graviteeAmIngressRoutes = new k8s.yaml.ConfigGroup("gravitee-am-ingress-routes", {
        files: [ path.join("components/kubernetes/gravitee-ingress-routes/am", "*.yaml") ],
    }, { parent: this, provider: k8sProvider });


    /// NOW DEPLOYING  GRAVITEE APIM
    /// const kubeconfig = this.eksCluster.kubeconfig.apply(JSON.stringify)
    /// const k8sProvider = new k8s.Provider(`${name}-k8s-provider`, {kubeconfig: kubeconfig});

    const $apim = new k8s.helm.v3.Chart(`gravitee-apim`, {
      fetchOpts: { repo },
      version: '1.29.3', // https://github.com/gravitee-io/helm-charts/blob/6089b683558aa268cc8ec51b3abe3ed4b8636f37/apim/Chart.yaml#L3
      chart: 'apim',
      // -----
      // Interpolations du values.yaml :
      // -
      // 1. toutes les occurrences de 'am.example.com', dans le  'gravitee-helm/am/values.yaml'
      ///   C'est à dire :
      //    => 'api.ingress.hosts[0].host' : `${nomdomaineAM}`,
      //    => 'api.ingress.tls.host' : `${nomdomaineAM}`
      //    => 'api.http.services.core.http.host' : `${nomdomaineAM}`
      //    => 'api.ingress.tls.host' : `${nomdomaineAM}`
      //    => 'api.ingress.tls.host' : `${nomdomaineAM}`
      // 2. Il faut aussi apporter les corrections de "apiVersion" du Chart officiel Gravitee Helm Chart
      // 3. L'unqiue paramètre, qui lie le cluster MongoDB à toutes les occurrences de 'am.example.com', dans le  'gravitee-helm/am/values.yaml'
      ///   C'est à dire :
      // sed -i "s#dbhost: ${WRONG_GIOONFARGATE_GRAVITEE_MONGO_HOST}#dbhost: ${GIOONFARGATE_GRAVITEE_MONGO_HOST}#g" gravitee-helm/am/values.yaml
      // -----
      // ok, pour se débarasser des ingress utilsier les "enabling options", pour ne plsu avoir besoin de "supprimer les définitons ingress à la volée" :
      // * `api.http.services.core.ingress.enabled` à `enabled: 'false'` : (`Ingress` "à l'ancienne" pour des fonctionnalités dites "core" du composant `Gravitee AM API`, je n'ai aucune idée de ce dont il s'aigt pour l'instant. L' `Ingress` est de toute façon par défaut à  'false', je vais tout de même lui affecter cette valeur explicitement pour montrer la globalité de la désactivation de tous les `Ingress`, dans la recette `pulumi` .
      // * `api.ingress.enabled` à `enabled: 'false'` (`Ingress` "à l'ancienne" pour le composant `Gravitee AM API`, sera remplacé par une `containous.traefik.io/IngressRoute:v1beta1`... )
      // * `gateway.ingress.enabled` à `enabled: 'false'` (`Ingress` "à l'ancienne" pour le composant `Gravitee AM Gateway`, sera remplacé par une `containous.traefik.io/IngressRoute:v1beta1`... )
      // * `ui.ingress.enabled` à `enabled: 'false'` (`Ingress` "à l'ancienne" pour le composant `Gravitee AM Web UI`, sera remplacé par une `containous.traefik.io/IngressRoute:v1beta1`... )
      //
      // Soit 4 désactivation explicites en tout.
      // -----
      values: {
        /* mongodb-replicaset: {
          persistentVolume : {
            size: `1Gi`
          }
        },*/
        es: {
          enabled: true, // même en passant la valeur "false"... Elastic Search est toujours requis par [Gravitee APIM]
          endpoints: ['http://gravitee-apim-elasticsearch-client.default.svc.cluster.local:9200'] /// http://graviteeio-apim-elasticsearch-client.default.svc.cluster.local:9200
        },
        elasticsearch: { // si je mets ce param à 'true', alors le Helm Chart va effectuer un déploiement de Elastic Search
          enabled: true /// will set that back to true, to provision the elastic search service
        }, // mais il faut se connecter en SSH à la VM sous jacente : pour préparer les spécifités elastic search.
        // Autrement dit, là, il faudrait juste qu'on balance un Elastic Search rapide avec une URL d'accès... et brancher
        mongo: {
          dbhost: `${mongodbHost}`,
          dbname: `gravitee-apim`
        },
        api: {
          /* gateway: {
            url: this.baseNomsDomainesGraviteeAPIM
          },*/
          ingress: {
            enabled: false,
            hosts: [
              // 'api.ingress.hosts[0].host' : "d471b47a0a0a9fa0685ffb85d47d8889.sk1.eu-west-1.eks.amazonaws.com",
              // # [JBL]-[api.ingress.hosts[0].host : `${baseNomsDomainesGraviteeAM}`]
              /// { host: this.baseNomsDomainesGraviteeAM }
              { host: this.baseNomsDomainesGraviteeAPIM + '-mgmt.mycompany.io:' +`${this.ingressControllerTLSPort}` } /// [api.ingress.hosts[0].host] donne une valeur à [MGMT_API_URL] pour le deployment de la Web UI de GRavitee AM (afin que la Web UI "tape" sur l'API Gravitee AM), cf. https://github.com/gravitee-io/helm-charts/blob/da34cd488e99a81e88e0b795e9b3f2af1d41a49d/am/templates/ui/ui-deployment.yaml#L49  et ce même quand le Ingress est configuré [enabled : 'false']
            ],
            tls: [ // not used, because ingress.enabled : 'false'
              // 'api.ingress.tls[0].hosts[0]' : "d471b47a0a0a9fa0685ffb85d47d8889.sk1.eu-west-1.eks.amazonaws.com",
              /// { host: this.baseNomsDomainesGraviteeAM }
              { host: this.baseNomsDomainesGraviteeAPIM + '-mgmt.mycompany.io:' +`${this.ingressControllerTLSPort}` }
            ]
          },
          http: {
              services: {
                core: {
                  http:
                     {// # [JBL]-[api.http.services.core.http.host]
                      // host: this.baseNomsDomainesGraviteeAM
                      // host: `gravitee-am.haddock.io`
                      host: `0.0.0.0`
                     },
                 ingress: {
                   enabled: false,
                   hosts:
                     {// # [JBL]-[api.http.services.core.ingress.hosts[0]] // utilisé pour exposer "The Gravitee AM Technical API"
                       host: this.baseNomsDomainesGraviteeAPIM + '-api.mycompany.io:' +`${this.ingressControllerTLSPort}` + `/technical-api`
                     }
                 }
                }
              }
           }
        },
        gateway: {
          ingress: {// # [JBL]-[gateway.ingress.hosts[0] : this.baseNomsDomainesGraviteeAM]
            enabled: false,
            hosts: [ this.baseNomsDomainesGraviteeAPIM + '-gw.mycompany.io:' +`${this.ingressControllerTLSPort}` ],
            tls: [
              {// # [JBL]-[gateway.ingress.tls[0].hosts[0] : this.baseNomsDomainesGraviteeAM]
                hosts: [ this.baseNomsDomainesGraviteeAPIM + '-gw.mycompany.io:' +`${this.ingressControllerTLSPort}` ]
              }
            ]
          }
        },
       ui: {
         ingress: {
           enabled: false,
           // # [JBL]-[ui.ingress.hosts[0] : this.baseNomsDomainesGraviteeAM]
           hosts: [ this.baseNomsDomainesGraviteeAPIM + '-mgmt.mycompany.io:' +`${this.ingressControllerTLSPort}` ],
           // # [JBL]-[ui.ingress.tls[0].hosts[0] : this.baseNomsDomainesGraviteeAM]
           tls: [ // non-utilisé car {enabled : 'false'} pour l'Ingress /// mais configuré, au cs où il soit utilisé d'autre part, comme d'autres ci-dessus
             { hosts: [ this.baseNomsDomainesGraviteeAPIM + '-mgmt.mycompany.io:' +`${this.ingressControllerTLSPort}` ] }
           ]
         }
       }
      },
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

          if (obj.kind === 'Ingress') {// not yet for ingresses :
            // obj.apiVersion = 'networking.k8s.io/v1' // https://github.com/gravitee-io/issues/issues/2835
                                              // [networking.k8s.io/v1] au lieu de [extensions/v1beta1]
                                              // Migrate to use the [policy/v1beta1 API], available since v1.10. Existing persisted data can be retrieved/updated via the new version.
          }                                   // NetworkPolicy in the extensions/v1beta1 API version is no longer served
        }
      ]
    ///}, { parent: this });
    ///}, { parent: this, provider: k8sProvider });
    }, { parent: this, provider: k8sProvider });

    /// NOW DEPLOYING INGRESS ROUTES FOR GRAVITEE APIM
    /// const kubeconfig = this.eksCluster.kubeconfig.apply(JSON.stringify)
    /// const k8sProvider = new k8s.Provider(`${name}-k8s-provider`, {kubeconfig: kubeconfig});

    const graviteeApimIngressRoutes = new k8s.yaml.ConfigGroup("gravitee-apim-ingress-routes", {
        files: [ path.join("components/kubernetes/gravitee-ingress-routes/apim", "*.yaml") ],
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
  * ${MONGO_HELM_DEPLOYMENT_NAME}-mongodb-replicaset-client.svc.cluster.local
  *
  * @knamespace : the Kubernetes namespace in which the  mongodb replicaset is deployed
  * @baseNomsDomainesGraviteeAM : par exemple `gravitee-am.mycompany.io`  https://gravitee-apim.mycompany.io/portal
  * @baseNomsDomainesGraviteeAPIM : par exemple `gravitee-apim.mycompany.io`  https://gravitee-apim.mycompany.io/portal
  **/
   public deployerGraviteeNonFargate (mongoHelmDeploymentName: string, knamespace: string, baseNomsDomainesGraviteeAM: string, baseNomsDomainesGraviteeAPIM: string) {
     /// TODO
     throw new Error("Method not implemented yet")
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
