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
 import * as aws from "@pulumi/aws";


/** -----
* VOILA COMMENT RECUPERER LA KUBECONFIG DU CLUSTER CREE AVEC EKS :
* https://github.com/alexbechmann/refract-cms/blob/46c69896a3b102f7ef7ead7bde9541f6125ca66b/pulumi/index.ts#L11
*
*
*
**/
import * as eks from "@pulumi/eks";


export interface GraviteeAPIMKubeArgs {
  // -- //
  // A reference on the created Kubernetes Cluster with EKS
  // https://github.com/pulumi/pulumi-eks#deploying-a-workload
  eksCluster: eks.Cluster;
  /**
   * For example, if set to `gravitee-apim`, then then Gravitee Gateway will
   * be exposed at https://gravitee-apim.mycompany.io/ and Gravitee API Consumers
   * Portal will be exposed at https://gravitee-apim.mycompany.io/portal
   **/
  baseNomsDomainesGraviteeAPIM: string;
  pulumiConfig: pulumi.Config;
  fargateProfile: aws.eks.FargateProfile;
}

/**
 *
 *
 * # ---
 * # Tested Helm configuration Values.yaml :
 * #
 * export SET_CHART_VALUES_STRING="es.endpoints[0]=${ES_ENDPOINT1},es.enabled=true,elasticsearch.enabled=false,mongodb-replicaset.enabled=false,rsEnabled=false,mongo.uri=${MONGO_URI},mongo.dbhost=${MONGO_HOST}"
 * export GRAVITEE_MGMT_UI_API_BASE_URL="http://apim.example.com:8383/management/organizations/DEFAULT/environments/DEFAULT/"
 * export GRAVITEE_PORTAL_API_BASE_URL="http://apim-portal.example.com:8383/portal/environments/DEFAULT"
 * export SET_CHART_VALUES_STRING="${SET_CHART_VALUES_STRING},portal.baseURL=${GRAVITEE_PORTAL_API_BASE_URL},ui.baseURL=${GRAVITEE_MGMT_UI_API_BASE_URL}"
 * export SET_CHART_VALUES_STRING="${SET_CHART_VALUES_STRING},gateway.logging.file.enabled=false,api.logging.file.enabled=false"
 * export SET_CHART_VALUES_STRING="${SET_CHART_VALUES_STRING},smtp.enabled=false"
 *
 * export GRAVITEEIO_VERSION=3.1.0
 * export GRAVITEEIO_VERSION=3.1.1
 *
 * export SET_CHART_VALUES_STRING="${SET_CHART_VALUES_STRING},apim.image.tag=${GRAVITEEIO_VERSION},portal.image.tag=${GRAVITEEIO_VERSION},ui.image.tag=${GRAVITEEIO_VERSION},gateway.image.tag=${GRAVITEEIO_VERSION}"
 *
 * echo "SET_CHART_VALUES_STRING=[${SET_CHART_VALUES_STRING}]"
 * helm install graviteeio-apim3x graviteeio/apim3 --set "${SET_CHART_VALUES_STRING}"
 *
 **/
export class GraviteeAPIMKube extends pulumi.ComponentResource {

  public readonly ingressControllerTLSPort: string // the string must be parseable as a valid port numbrer for the cloud provider. Like [443] or [4443]

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
  ///
  /**
   * Sets Hosts values "inside the Gravitee Apllication" :  for CORS etc...
   * For example, if set to `gravitee-apim`, then then Gravitee Gateway will
   * be expected exposed at https://gravitee-apim.mycompany.io/ and Gravitee API Consumers
   * Portal will be exposed at https://gravitee-apim.mycompany.io/portal
   **/
  public readonly baseNomsDomainesGraviteeAPIM: string;

  constructor (
    name: string,
    args: GraviteeAPIMKubeArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super(`${pulumi.getProject()}:GraviteeAPIMKube`, name, {}, opts)

    // Utilisé pour provisionner Gravitee
    this.eksCluster = args.eksCluster;
    this.ingressControllerTLSPort = '443'; /// GRavtieee Ingress Will use 443 as TLS Port no.
    this.baseNomsDomainesGraviteeAPIM = args.baseNomsDomainesGraviteeAPIM;

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

    this.baseNomsDomainesGraviteeAPIM = args.baseNomsDomainesGraviteeAPIM
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

    // const mongodbHost = this.mongoHelmDeploymentName + `-mongodb-replicaset-client.${knamespace}.svc.cluster.local`; // this would be for an in-cluster provisoned 'MongoDB ReplicaSet'


    const externalElasticEndpoint = `${args.pulumiConfig.require("elastic_endpoint")}`;


    /// NOW DEPLOYING GRAVITEE APIM with Helm v3
    const $apim = new k8s.helm.v3.Chart(`${args.pulumiConfig.require("gravitee_apim_helm_release_name")}`, {
      namespace: `${args.pulumiConfig.require("k8s_namespace")}`,
      fetchOpts: { repo },
      version: `${args.pulumiConfig.require("gravitee_apim_chart_version")}`, // 3.0.4 [helm search repo graviteeio #  helm repo add graviteeio https://helm.gravitee.io] to check all charts versions, latest is currently [3.0.4]
      chart: `${args.pulumiConfig.require("gravitee_apim_helm_chart_repo_id")}`, /// that's for 'helm install myrelease graviteeio/apim3' from readme.md
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
        'mongodb-replicaset': {
          enabled: false,
        },
        smtp: {enabled: false},
        es: {
          enabled: true, // même en passant la valeur "false"... Elastic Search est toujours requis par [Gravitee APIM]
          /// endpoints: ['http://gravitee-apim-elasticsearch-client.default.svc.cluster.local:9200']
          endpoints: [`${args.pulumiConfig.require("elastic_endpoint")}`]
        },
        elasticsearch: { // if set to 'true', Helm Chart will deploy Elastic Search in Kubernetes cluster :
          enabled: false /// external Elasticsearch Service because of fargate
        },
        mongo: {
          uri: `${args.pulumiConfig.require("mongo_uri_protocol")}` + "://" + `${args.pulumiConfig.require("mongo_host")}` + ":" + `${args.pulumiConfig.require("mongo_port")}` + `/${args.pulumiConfig.require("mongo_db_name")}?serverSelectionTimeoutMS=5000&connectTimeoutMS=30000&socketTimeoutMS=30000`,
          // dbhost: `${args.pulumiConfig.require("mongo_host")}`,
          // dbport: `${args.pulumiConfig.require("mongo_port")}`,
          // dbname: `gravitee-apim`,
          rsEnabled: false
        },
        api: {
          service: {
            labels: {
               // Fargate Scheduler PodSelector / label
              'eks.amazonaws.com/fargate-profile': `${args.fargateProfile.fargateProfileName}`,
              'graviteeio/serverless': 'fargate'
          },
          image: {
            tag: `${args.pulumiConfig.require("gravitee_containers_tag")}`
          },
          logging: {
            file: {
              enabled: false
            }
          },
          /* gateway: {
            url: this.baseNomsDomainesGraviteeAPIM
          },*/
          ingress: {
            enabled: false, /// Only Gateway external exposure
            hosts: [
              { host: 'localhost' }
            ],
            tls: [
              { host: 'localhost' }
            ]
          },
          http: {
              services: {
                core: {
                  http:
                     {
                      host: `0.0.0.0`
                     },
                 ingress: {
                   enabled: false,
                   hosts:
                     {
                       host: 'localhost'
                     }
                 }
                }
              }
           }
        },
        gateway: {
            image: {
              tag: `${args.pulumiConfig.require("gravitee_containers_tag")}`
            },
            logging: {
              file: {
                enabled: false
              }
          },
          service: {
            labels: {
               // Fargate Scheduler PodSelector / label
              'eks.amazonaws.com/fargate-profile': `${args.fargateProfile.fargateProfileName}`,
              'graviteeio/serverless': 'fargate'
            }},
            annotations: {
               // AWS ALB Annotations to define container networking type
              'alb.ingress.kubernetes.io/target-type': 'ip'
            }
          },
          ingress: {
            annotations: { // AWS ALB Annotation to expose ingress through AWS ALBalancer
              'kubernetes.io/ingress.class': 'alb',
              'alb.ingress.kubernetes.io/scheme': 'internet-facing'
            },
            enabled: true, /// could be exposed via AWS ALB Load Balancer, or traefik exposed only, then traefik reverse proxies the Gateway
            hosts: [ this.baseNomsDomainesGraviteeAPIM + `.${args.pulumiConfig.require("corporate_domain_name")}` ],
            tls: [
              {
                hosts: [ this.baseNomsDomainesGraviteeAPIM + `.${args.pulumiConfig.require("corporate_domain_name")}` ]
              }
            ]
          }
        },
       ui: {
         service: {
           labels: {
              // Fargate Scheduler PodSelector / label
             'eks.amazonaws.com/fargate-profile': `${args.fargateProfile.fargateProfileName}`,
             'graviteeio/serverless': 'fargate'
           }},
         image: {
           tag: `${args.pulumiConfig.require("gravitee_containers_tag")}`
         },
         baseURL: "http://localhost:"+ `${args.pulumiConfig.require("kubectl_port_forward_mgmt_ui")}` + "/management/organizations/DEFAULT/environments/DEFAULT/", /// kubectl port-forward admin staff will access MGMT UI on localhost
         ingress: {
           enabled: false, /// management ui available only with Kubectl : protected by KUBECONFIG, only for admin staff
           hosts: [ "localhost"+ `${args.pulumiConfig.require("kubectl_port_forward_mgmt_ui")}` ],
           tls: [
             { hosts: [ this.baseNomsDomainesGraviteeAPIM + `.${args.pulumiConfig.require("corporate_domain_name")}:` +`${this.ingressControllerTLSPort}` ] }
           ]
         }
       },
       portal: {
         service: {
           labels: {
              // Fargate Scheduler PodSelector / label
             'eks.amazonaws.com/fargate-profile': `${args.fargateProfile.fargateProfileName}`,
             'graviteeio/serverless': 'fargate'
           }},
         image: {
           tag: `${args.pulumiConfig.require("gravitee_containers_tag")}`
         },
         baseURL: this.baseNomsDomainesGraviteeAPIM + `.${args.pulumiConfig.require("corporate_domain_name")}:` +`${this.ingressControllerTLSPort}` + "/management/organizations/DEFAULT/environments/DEFAULT/", /// kubectl port-forward admin staff will access MGMT UI on localhost
         hosts: [ this.baseNomsDomainesGraviteeAPIM + `.${args.pulumiConfig.require("corporate_domain_name")}:` +`${this.ingressControllerTLSPort}` ],
         tls: {
           hosts: [ this.baseNomsDomainesGraviteeAPIM + `.${args.pulumiConfig.require("corporate_domain_name")}:` +`${this.ingressControllerTLSPort}` ],
         }
       }
      },
      transformations: [ // those transformations to on-the-fly adapt Kubernetes Upstream version, see https://github.com/gravitee-io/issues/issues/2835
        (obj: any) => { // https://cloud.google.com/kubernetes-engine/docs/deprecations/apis-1-16 : applies to [daemonsets], [staefulsets], and [deployments]
          if (obj.kind === 'Deployment') {
            obj.apiVersion = 'apps/v1'        // instead of [extensions/v1beta1], [apps/v1beta1], ou [apps/v1beta2] in the yaml manifests files of "kind" deployment
          }; // warning: apps/v1beta2/StatefulSet is deprecated by apps/v1/StatefulSet and not supported by Kubernetes v1.16+ clusters.
          if (obj.kind === 'StatefulSet') {    // https://github.com/gravitee-io/issues/issues/2835
                                               // // warning: apps/v1beta2/StatefulSet is deprecated by apps/v1/StatefulSet and not supported by Kubernetes v1.16+ clusters.
            obj.apiVersion = 'apps/v1'          // instead of [extensions/v1beta1], [apps/v1beta1], ou [apps/v1beta2] in the yaml manifests files of "kind" statefulset,
          };
          if (obj.kind === 'Daemonset') {    // https://github.com/gravitee-io/issues/issues/2835
                                               // // warning: apps/v1beta2/StatefulSet is deprecated by apps/v1/StatefulSet and not supported by Kubernetes v1.16+ clusters.
            obj.apiVersion = 'apps/v1'          // instead of [extensions/v1beta1], [apps/v1beta1], ou [apps/v1beta2] in the yaml manifests files of "kind" statefulset,
          };

          if (obj.kind === 'Ingress') {

            // not yet for ingresses : 
            // obj.apiVersion = 'networking.k8s.io/v1' // https://github.com/gravitee-io/issues/issues/2835
                                              // [networking.k8s.io/v1] instead of [extensions/v1beta1]
                                              // Migrate to use the [policy/v1beta1 API], available since v1.10. Existing persisted data can be retrieved/updated via the new version.
          }                                   // NetworkPolicy in the extensions/v1beta1 API version is no longer served
        }
        ///               servicePort: 83 # spec.rules[0].http.paths[0].backend.serviceName : to set int Pulumi module
        ///                              # spec.rules[0].http.paths[0].backend.servicePort : to set int Pulumi module
      ]
    }, { parent: this, provider: k8sProvider });



  }


}
