# Gravitee Ingresses

Non, un seul Ingress Controller, mais :
* si on a un cluster, et que l'on n'a pas déployé d'`Ingress Controller`, `nginx`, `traefik` ou un autre, comme dans `minikube`, et que tu créées un `Ingress` pour déployer ton app : même si tu as installé un load balancer dans ton infra comme `ELB` ou `meltalLB` dont on parlait mi-mai `2020`, on ne peut pas obtenir d'`External IP` : Sans `Ingress Controller`, l'`Ingress` c'est juste papier avec des infos, c'est tout.
* L'`Ingress Controller`, instancie chacun des `Ingress` déployés : chaque app déploie son ingress, et il est réalisé, pour chaque app, par le ingress controller : dans ce cas, il y a un seul `Load Balancer`.
* `Gravitee` peut avoir jusqu'à 8 `Ingress`, et si on active les `8,` on aura les `8` qui passeront par le même LoadBalancer : cela que ce soit traefik `v1.x.x`, ou traefik `v2.x.x`.
* Si on est en traefik `v1.x.x` : le principe, c'est que tu mets des annotations à chacun de tes app, et l'`Ingress`, pour que `traefik` "le chope à la volée au déploiement", et créées la route effective de l'app, en jouant le rôle naturel de reverse proxy, comme avec docker-compose.
* Si on est en traefik `v2.x.x` : le principe, c'est "plus d'anotations sapin de noel partout sur les deployments et `Ingress`" : on fait une `Ingress Route` par point d'accès et terminé.
* Le helm chart gravitee est indépendant du choix de l'`Ingress`, dans les deux cas, est conçut pour `traefik v1`  et `traefik v2`  c'est `traefik` qui donne un peu de taff, avec son nouveau concept.


Au final :
* je suis en mode "j'expose tout", pour bien voir que "otut marche de l'exterieur",
* après, je propose de rendre accessible uniquement en interne au cluster, par `kubectl port-forward`  les 2 `WebUI` de `Gravitee` , et leurs 2 `API`,
* ce qui fait 2 `IngressRoutes` exposant publiquement unqiuement la gateway (partie `AM (Access Management)`  et partie `APIM (API Management)` ( _API Management_ donc les permissions aux consommateurs de l' API PostNL)`
* et 4 Ingress qui deviennent de simples Service de type `ClusterIP` donc juste load balancés en interne au réseau `Kubernetes`.


# Du Quatrième `Ingress` : le contenu Statique du Web Client Gravitee

ok je crois que j'ai compris ce qui arrive :
* ce qui fait les erreurs ci-dessus, immédait à voir, c'est le fait l'on aune réponse 404 de traefik pour ce qui est des ressoruces statiques (css javascript etc)
* la question "je fais comment pour servir un site statique avec traefik " ? est uen queston qui revient tout le temps : bon il faut un server http derrière traefik
* Gravitee peut fonctionner sans aucun ingress controller dans docker-compose : il y a déjà, alors, un serveur HTTTP, peu importe lequel, pour servir les fichiers statiques de la Web UI.
* Alors résumons : j'ai ouvert 3 des 4 Ingress, pour avoir acc_ès à la Web UI,
* et manifestmeent, traefik ne me donne pas accès à quelque chose
* conclusion : le 4 ième Ingress, c'est pour ouvrir le serveur HTTP qui sert le contenu statique,
* et dans le `values.yaml`  du `Helm Chart` `Gravitee` , la propriété permettant de cofnigurer ce 4 ième et dernier `Ingress`, est nommée `api.http.services.core.ingress.enabled`. voilà, Http Services l'ingress du serveur de fichiers statiques de la `Web UI`, qui n'ets plus mystérieux.

# De la variable `MGMT_API_URL`

https://github.com/gravitee-io/helm-charts/blob/da34cd488e99a81e88e0b795e9b3f2af1d41a49d/am/templates/ui/ui-deployment.yaml#L49

* Pour le composant `Gravitee AM Web UI`, la variable d'environnement `MGMT_API_URL` peut-être utilisée pour configurer l'URL d'accès à la `Gravitee AM API`, du client Web
* le `Helm Chart Gravitee AM`, pour fixer la valeur de `MGMT_API_URL`, utilise dans `values.yaml`, le paramètre api.ingress.hosts[0].host

```Yaml
    - name: MGMT_API_URL
      value: "https://{{(index .Values.api.ingress.hosts 0).host }}"
    - name: MGMT_UI_URL
      value: "https://{{index .Values.ui.ingress.hosts 0 }}/ui"
```


# Traefik CORS Middleware

cf. les middlewares et les CORS middlewares
* dans le ingress route o ajoute :

```Yaml
# As a Kubernetes Traefik IngressRoute
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  name: middlewares.traefik.containo.us
spec:
  group: traefik.containo.us
  version: v1alpha1
  names:
    kind: Middleware
    plural: middlewares
    singular: middleware
  scope: Namespaced

---
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: stripprefix
spec:
  stripPrefix:
    prefixes:
      - /stripit

---
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: ingressroute
spec:
# more fields...
  routes:
    # more fields...
    middlewares:
      - name: stripprefix
```
