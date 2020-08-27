# Gravitee Team : How I installed, and used `kube2pulumi`

```bash
jbl@poste-devops-jbl-16gbram:~/gio/components/aws/networking$ curl -LO https://github.com/pulumi/kube2pulumi/releases/download/v0.0.3/kube2pulumi-v0.0.3-linux-amd64.tar.gz
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   650  100   650    0     0   2981      0 --:--:-- --:--:-- --:--:--  2968
100 9164k  100 9164k    0     0  6386k      0  0:00:01  0:00:01 --:--:-- 28.3M
jbl@poste-devops-jbl-16gbram:~/gio/components/aws/networking$ tar -tf kube2pulumi-v0.0.3-linux-amd64.tar.gz
LICENSE
README.md
kube2pulumi
jbl@poste-devops-jbl-16gbram:~/gio/components/aws/networking$ tar -xf kube2pulumi-v0.0.3-linux-amd64.tar.gz
jbl@poste-devops-jbl-16gbram:~/gio/components/aws/networking$ ls -allh
total 35M
drwxr-xr-x 2 jbl jbl 4.0K Aug 24 21:29 .
drwxr-xr-x 6 jbl jbl 4.0K Aug 21 21:08 ..
-rw-r--r-- 1 jbl jbl 4.0K Aug 24 20:36 alb-iam-policy.json
-rw-r--r-- 1 jbl jbl 4.0K Aug 24 20:39 alb-iam-policy.ts
-rw-r--r-- 1 jbl jbl  33K Aug 24 19:24 ALB-Ingress-Controller-Fargate-architecture_pod.png
-rw-r--r-- 1 jbl jbl  13K Aug 24 21:26 AwsALB.ts
-rwxr-xr-x 1 jbl jbl  25M Aug 15 01:01 kube2pulumi
-rw-r--r-- 1 jbl jbl 9.0M Aug 24 21:28 kube2pulumi-v0.0.3-linux-amd64.tar.gz
-rw-r--r-- 1 jbl jbl  12K Aug 15 00:59 LICENSE
-rw-r--r-- 1 jbl jbl 4.0K Aug 24 20:41 pulumized-alb-iam-policy.ts
-rw-r--r-- 1 jbl jbl  992 Aug 24 21:14 rbac-role.yaml
-rw-r--r-- 1 jbl jbl 7.3K Aug 15 00:59 README.md
-rw-r--r-- 1 jbl jbl  11K Aug 22 12:36 UnderlayVPC.ts

```

* And I generated tyhe typescript code :

```bash
jbl@poste-devops-jbl-16gbram:~/gio/components/aws/networking$ ./kube2pulumi typescript -f ./rbac-role.yaml
Conversion successful! Generated File: index.ts
jbl@poste-devops-jbl-16gbram:~/gio/components/aws/networking$ cat index.ts
import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

const alb_ingress_controllerClusterRole = new kubernetes.rbac.v1.ClusterRole("alb_ingress_controllerClusterRole", {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "ClusterRole",
    metadata: {
        labels: {
            "app.kubernetes.io/name": "alb-ingress-controller",
        },
        name: "alb-ingress-controller",
    },
    rules: [
        {
            apiGroups: [
                "",
                "extensions",
            ],
            resources: [
                "configmaps",
                "endpoints",
                "events",
                "ingresses",
                "ingresses/status",
                "services",
            ],
            verbs: [
                "create",
                "get",
                "list",
                "update",
                "watch",
                "patch",
            ],
        },
        {
            apiGroups: [
                "",
                "extensions",
            ],
            resources: [
                "nodes",
                "pods",
                "secrets",
                "services",
                "namespaces",
            ],
            verbs: [
                "get",
                "list",
                "watch",
            ],
        },
    ],
});
const alb_ingress_controllerClusterRoleBinding = new kubernetes.rbac.v1.ClusterRoleBinding("alb_ingress_controllerClusterRoleBinding", {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "ClusterRoleBinding",
    metadata: {
        labels: {
            "app.kubernetes.io/name": "alb-ingress-controller",
        },
        name: "alb-ingress-controller",
    },
    roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "alb-ingress-controller",
    },
    subjects: [{
        kind: "ServiceAccount",
        name: "alb-ingress-controller",
        namespace: "kube-system",
    }],
});
jbl@poste-devops-jbl-16gbram:~/gio/components/aws/networking$ cp index.ts generated-fargate-alb-rbac.ts && rm index.ts
```

### Generating Typescript code to provision Traefik As simple Reverse proxy

```bash
# PWD : ./components/kubernetes/traefik/reverse-proxy/
# kube2pulumi from root :  ./components/utils/kube2pulumi-converter/kube2pulumi
# yamls from root :
# => ./components/kubernetes/traefik/reverse-proxy/traefik-deployment.yaml
# => ./components/kubernetes/traefik/reverse-proxy/traefik-service.yaml
# => ./components/kubernetes/traefik/reverse-proxy/traefik-ingress.yaml




../../../utils/kube2pulumi-converter/kube2pulumi typescript -f ./traefik-deployment.yaml
cp index.ts traefik-deployment.ts
rm index.ts
../../../utils/kube2pulumi-converter/kube2pulumi typescript -f ./traefik-service.yaml
cp index.ts traefik-service.ts
rm index.ts
../../../utils/kube2pulumi-converter/kube2pulumi typescript -f ./traefik-ingress.yaml
cp index.ts traefik-ingress-route-crd.ts
rm index.ts


```
