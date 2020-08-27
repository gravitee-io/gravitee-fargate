# Brouillon : sur les `dependsOn`, `helm charts`, et graphe des Dépendances

pour implémenter l'arbre des dépendances ds notre deploiement helm, on utilisera :

* la propriété pulumi `dependsOn` en exemple ci-dessous :

```TypeScript
// logstash va "attendre" que ELK soit Prêt et opérationnel
const logstash = new k8s.helm.v3.Chart("logstash",
    {
        repo: "alicorpacr",
        chart: "logstash",
        fetchOpts: {
            username: "alicorpacr",
            password: "CiRuDD9883jMcGu6NIATyy/lhgPQL3fI"
        }

    },  { providers: { kubernetes: elk.k8sProviderelk }, dependsOn: [elk.k8sElk/*,elastic*/] }
);
```
* Notez : Ici, `elk.k8sProviderelk` est le `KUBECONFIG` du cluster surlequel ce monsieur s'amuse avec `Elastic Stack`

* https://github.com/iiglesiasg/elastic-stack/blob/e46fe957fb85c5e3948cdbf0cae415bd6c8d468c/elk-k8s/index.ts#L55

# Module `GraviteeKube`


### Architecture du déploiement : Et le 7 ième jour, il se reposa.

* La partie `GW (Gateway)` de Gravitee, est celle qui de loin, doit supporter le plus grosse charge :
  * Elle reçoit les requêtes des app mobiles et client web browsers des utilisateurs finaux B2C (paiements ecommerce)
  * Alors que la partie `AM` (Access Management), n'est appelée que lorsque les clients renouvellent leurs clefs d'API (à l'aide de la WebUI de l'AM, on va créer/modifier/supprimer ce que gravitee appelle _un `client`_, qui sera utilisé par des applications derrière, pour obtenir des `API Token`)
  * et que al partie APIM, elle aussi destinée à des fonctionnalités de manageemnt, ne sera pas du tout autant sollicitée
Donc :
* **AM** Un simple Pod Deployment pour l'AM, qui pourra avoir un petit scale up au cas où, donc avec load balancing traefik (à voir le type d'accès, probalbement pas besoin d'accès externe, c'est de l'accès machine to machine, car nous crérons automatiqueemnt les users, cf. https://docs.gravitee.io/am/2.x/am_protocols_users_overview.html). **Nous avons décidé qu'il s'agirait d'un Service à part entière, faiblement scalé au départ**
* **GW (Gateway)** :
  * Là, ça va grossir très vite, donc un Service permettant le scale up maximal, avec un load balacing du serice par un `Ingress`, instance de `Traefik Ingress Controller`.
  * la "gateway" est séparée en 2 : `apim_gateway` et `am_gateway`
  * et les 2 gateway, sont enchaînées comme dans le design pattern `Filtre/Filter` :
    * la première gateway applique l'authentification
    * la seconde gateway applique les autorisations / permissions
    * Tapez `Jee Security Filter` ou `javax.servlet.Filter`, si mes souvenirs sont bons
* **APIM** :  elle aussi destinée à des fonctionnalités de manageemnt (Subscribe plans, applications, etc...), ne sera pas du tout autant sollicitée, qua la gateway.**Nous avons décidé qu'il s'agirait d'un Service à part entière, faiblement scalé au départ**
* Soit 5 composants en tout, plus les 2 applis Web UI : **7 services** en tout.



La pratique répandue semble donc être de définir un service entièrement dédié à l'`APIM`, qui scalera fort, et probablement un simple `Deployment` de pod, pour l' `AM`.

Or :
* Parmi les documentations référencées en annexe, une seule comporte "une recette avec tout", prête à l'emploi, celle-ci : https://github.com/gravitee-io/helm-charts
* Ce qui implique que je passe à la stratégie "exécuter un Helm Chart à partir de fichiers"
* qui a l'avantage de proposer un support gratuit et sérieux : on peut ouvrir des tickets dessus et l'équipe gravitee débogguera tout les bogues trouvés sur github gratuitement, et il y a une améioration continue très active
* Si bien que je propose de passer sur cette recette,
* et sa mise en oeuvre est un problème clair, et soluble en moins de 2 jours maximmum

Notre décision est de faire simple et homogéne :
* 7 services `Kubernetes` à part entière, pour chacun des 7 composants gravitee.
* Et nous suivons les Helm Chart officiels `Gravitee.io` : https://github.com/gravitee-io/helm-charts


# Orchestration : Graphe des dépendances

Capital : la gestion des rapports de dépendance à l'exécution (orchestration du déploiement)

* Ok, il est classique, et avec Gravitee.io, c'est notre cas, de déployer plusieurs services qui collaborent.
* Or l'exemple : https://github.com/marcus-sa/pulumi-kubernetes-istio/blob/0061ceedf3d66b7ebd82abbfb8c6730edaffa547/examples/nodejs/src/istio.ts
* montre très bien comment utliser des `depends_on` qui vont permettre la configuration de l'orchestration :
  * du déploiement (qui nous intéresse en premier)
  * de toutes les opérations standard, en fait : update, upgrades, ( backup, restore ?) etc..

Et dans notre cas le POC a permis de montrer :
* avec le docker-compose  https://gitlab.com/bureau1/pulumi-workshops/poc-api-gateway/poc-graviteeio/-/blob/master/docker-compose.yml  cf. commit `a0e289f3509612a11a5107cfdce2923538e331e3`
* que l'orchestration doit ête configurée par les contraintes suivantes :

```Yaml
mongodb: # aucune dépendance
  image: mongo:${MONGODB_VERSION:-3.4}
elasticsearch: # aucune dépendance
  image: docker.elastic.co/elasticsearch/elasticsearch:${ELASTIC_VERSION:-6.3.1}
apim_management:
  image: graviteeio/management-api:${APIM_VERSION:-latest}
apim_gateway:
  image: graviteeio/gateway:${APIM_VERSION:-latest}
  depends_on:
    - mongodb
    - elasticsearch
depends_on:
  - mongodb
  - elasticsearch
apim_portal:
  image: graviteeio/management-ui:${APIM_VERSION:-latest}
  depends_on:
    - apim_management
am_gateway:
  image: graviteeio/am-gateway:${AM_VERSION:-latest}
  depends_on:
    - mongodb

am_management:
  image: graviteeio/am-management-api:${AM_VERSION:-latest}
  depends_on:
    - mongodb

am_webui:
  image: graviteeio/am-management-ui:${AM_VERSION:-latest}
  depends_on:
    - am_management

traefik:
  image: traefik:v1.7
  depends_on:
    - apim_gateway
    - apim_portal
    - apim_management
    - am_gateway
    - am_management
    - am_webui

```
