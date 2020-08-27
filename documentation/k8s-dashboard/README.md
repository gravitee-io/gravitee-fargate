
# Accéder à un Kubernetes Dashboards

## Official K8S Dashboard

* Deploy it :

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta8/aio/deploy/recommended.yaml
```

* Un-deploy it :

```bash
kubectl delete -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta8/aio/deploy/recommended.yaml
```

Remarque :
* Récupérer `~/.aws/credentials` m'a suffit pour pouvoir accéder au dashboard `spekt8` (cf. parfaggraphe suivant)
* Cela ne m'a pas suffit à accéder au dashboad "officiel", pour lequel un autre problème subsiste, probablement spécfique à ce dashboard là.
* C'est pourquoi j'ai eut recours  à un autre dashboard, plutôt que de régler le problème du dashboard officiel sous `EKS/Fargate`


## Alternative `spekt8` dashboard

https://github.com/spekt8/spekt8

* Deploy it :

```bash
kubectl apply -f https://raw.githubusercontent.com/spekt8/spekt8/master/spekt8-deployment.yaml
# RBAC
kubectl apply -f https://raw.githubusercontent.com/spekt8/spekt8/master/fabric8-rbac.yaml

```
* You will soon (when deployment of the dashboard has completed) be able to access the dashboard
* J'ai, après quelques minutes, pu "entrer dans le conteneur" déployé avec :

```bash
kubectl port-forward deployment/spekt8 3000:3000
```


* https://aws.amazon.com/blogs/aws/amazon-eks-on-aws-fargate-now-generally-available/
