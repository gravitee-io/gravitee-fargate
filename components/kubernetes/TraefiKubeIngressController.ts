import * as pulumi from '@pulumi/pulumi';
import * as path from "path";
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


export interface TraefiKubeIngressControllerArgs {
  scaleUpOrder: number;
  helmChartVersion: string; // must comply to semver, use linter inside package.json scripts section
  // -- //
  // A reference on the created Kubernetes Cluster with EKS
  // https://github.com/pulumi/pulumi-eks#deploying-a-workload
  eksCluster: eks.Cluster;
  /// example 4443
  ingressControllerTLSPort: string;
}
/**
 *
 * Traefik V2 As Ingress Controller, CRD based Ingress Routes for apps
 *
 **/
export class TraefiKubeIngressController extends pulumi.ComponentResource {
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
  // La valeur de ce paramètre doit être fournie au constructeur, via le [TraefiKubeIngressControllerArgs]
  // En Java on aurait eut : 'private String monAttribut; // plus les méthodes get set public et private resp.'
  // public readonly desiredReplicaNumber: pulumi.Output<number>
  public readonly desiredReplicaNumber: number

  public readonly desiredHelmChartVersion: string // must comply to semver, use linter inside package.json scripts section
  public readonly ingressControllerTLSPort: string // the string must be parseable as must be a valid port numbrer for the cloud provider. Like [443] or [4443]
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
    args: TraefiKubeIngressControllerArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super(`${pulumi.getProject()}:TraefiKubeIngressController`, name, {}, opts)
    /**
     * Tout votre code Pulumi
     **/

    // let valeurScaleUpOrder = new pulumi.Output<number>(args.scaleUpOrder);

    // Utilisé pour provisionner Gravitee
    this.desiredReplicaNumber = args.scaleUpOrder;
    this.desiredHelmChartVersion = args.helmChartVersion;
    this.eksCluster = args.eksCluster;
    this.ingressControllerTLSPort = args.ingressControllerTLSPort;
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
        files: [ path.join("components/kubernetes/traefik/ingress-controller", "*.yaml") ],
    }, { parent: this, provider: k8sProvider });

    const ingressControllerService = traefik.getResource("v1/Service", "traefik");


  }
}
