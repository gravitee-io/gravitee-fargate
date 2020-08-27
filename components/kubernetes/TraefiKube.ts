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


export interface TraefiKubeArgs {
  scaleUpOrder: number;
  helmChartVersion: string; // must comply to semver, use linter inside package.json scripts section
  // -- //
  // A reference on the created Kubernetes Cluster with EKS
  // https://github.com/pulumi/pulumi-eks#deploying-a-workload
  eksCluster: eks.Cluster;
  pulumiConfig: pulumi.Config;
}
/**
 *
 * Traefik V2 As simple Reverse Proxy, not an Ingress Controller
 *
 **/
export class TraefiKube extends pulumi.ComponentResource {
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
  // La valeur de ce paramètre doit être fournie au constructeur, via le [TraefiKubeArgs]
  // En Java on aurait eut : 'private String monAttribut; // plus les méthodes get set public et private resp.'
  // public readonly desiredReplicaNumber: pulumi.Output<number>
  public readonly desiredReplicaNumber: number

  public readonly desiredHelmChartVersion: string // must comply to semver, use linter inside package.json scripts section
  public readonly gioTLSport: string // the string must be parseable as must be a valid port numbrer for the cloud provider. Like [443] or [4443]
  // --
  // une fois le déploiement réalisé, le nombre de réplica est lu par 'kubectl describe gravitee', et le replicaNumber retourné est affecté comme valeur de cet attribut.
  /// public zeroTimeReplicaNumber: pulumi.Output<number>
  public zeroTimeReplicaNumber: number

  // The Pulumi Key to retrieve the secret from ENV
  public readonly gitlabRegistrySecretPulumiKey: string

  public readonly eksCluster: eks.Cluster;


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

  /// public readonly IPs: pulumi.Output<string>

  constructor (
     // Ces trois arguments seront attendus par le constructeur de
     // la classe Mère :  pulumi.ComponentResource
    name: string,
    args: TraefiKubeArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super(`${pulumi.getProject()}:TraefiKube`, name, {}, opts)
    /**
     * Tout votre code Pulumi
     **/

    // let valeurScaleUpOrder = new pulumi.Output<number>(args.scaleUpOrder);

    // Utilisé pour provisionner Gravitee
    this.desiredReplicaNumber = args.scaleUpOrder;
    this.desiredHelmChartVersion = args.helmChartVersion;
    this.eksCluster = args.eksCluster;
    this.gioTLSport = '443';
    // valeur par défaut :
    // Cette valeur devra être fournie par la méthode [deployerGravitee()]
    /// let valeurZeroTimeReplicaNumber = pulumi.output(0);

    // let valeurZeroTimeReplicaNumber = new pulumi.OutputInstance(0);
    this.zeroTimeReplicaNumber = 2;
    // non utilisé
    this.gitlabRegistrySecretPulumiKey = "gitlabRegistrySecret-ro";

    // ---------------------------------
    // Helm Charts common properties
    // --
    // Initialization : helm repo add graviteeio https://helm.gravitee.io
    // --
    // cf. la méthode [ executerUnHelmChart () {} ]
    // --
    this.helmRepoID = "gio-helm-traefik";
    // Si notre Helm Chart Traefik était sur un monocular private helm hub , par exemple https://helm.mycompany.io ... ///
    this.helmRepoURL = "https://helm.mycompany.io";
    this.chartVersion = "latest";
    // ---
    // this.deployerGravitee(name);


    /**
     * FIX POUR APPLY LES YAMLS
     */
    /// trick about the provider : https://github.com/pulumi/pulumi-kubernetes/issues/1032
    ///
    const kubeconfig = this.eksCluster.kubeconfig.apply(JSON.stringify)
    const k8sProvider = new k8s.Provider(`${name}-k8s-provider`, {kubeconfig: kubeconfig});

    /*
    const k8sProvider = new k8s.Provider(`${name}-k8s-provider`, {
      kubeconfig: this.eksCluster.kubeconfig,
    }, { parent: this })
    */
    const traefik = new k8s.yaml.ConfigGroup("traefik", {
        files: [ path.join("components/kubernetes/traefik/reverse-proxy", "*.yaml") ],
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
              ///               servicePort: 83 # spec.rules[0].http.paths[0].backend.serviceName : to set int Pulumi module
              ///                              # spec.rules[0].http.paths[0].backend.servicePort : to set int Pulumi module
              const gravitee_apim_helm_release_name = `${args.pulumiConfig.require("gravitee_apim_helm_release_name")}`
              const gravitee_apim_helm_chart_repo_id = `${args.pulumiConfig.require("gravitee_apim_helm_chart_repo_id")}`
              const gravitee_apim_gateway_k8S_svc_name = `${gravitee_apim_helm_release_name}` + "-" + `${gravitee_apim_helm_chart_repo_id}` + "-" + 'gateway'

              obj.spec.rules[0].http.paths[0].backend.serviceName = `${gravitee_apim_gateway_k8S_svc_name}`;
              obj.spec.rules[0].http.paths[0].backend.servicePort = '83';

              // not yet for ingresses : 
              // obj.apiVersion = 'networking.k8s.io/v1' // https://github.com/gravitee-io/issues/issues/2835
                                                // [networking.k8s.io/v1] instead of [extensions/v1beta1]
                                                // Migrate to use the [policy/v1beta1 API], available since v1.10. Existing persisted data can be retrieved/updated via the new version.
            }                                   // NetworkPolicy in the extensions/v1beta1 API version is no longer served
          }

        ]
    }, { parent: this, provider: k8sProvider });


      const traefikIngress= traefik.getResource("v1/Service", "traefik");

      // serviceName: graviteeio-apim3x-gateway # Where Helm Release name for [Gravitee APIM 3.x] is [graviteeio-apim3x]

      /*
      let IngressELBElasticIPs = pulumi.all([
        ingressControllerService.spec.externalIPs[0].toString(),
        ingressControllerService.spec.externalIPs[1].toString()
      ]).apply(([eip1, eip2]) =>  `Traefik Ingress Elastic Load Balancer IP pool has two IPs, eip1=[${eip1}], eip2=[${eip2}] `);

      /// eip1.apply(v => `${v}`)

      this.IPs = IngressELBElasticIPs
      */


  }
}
