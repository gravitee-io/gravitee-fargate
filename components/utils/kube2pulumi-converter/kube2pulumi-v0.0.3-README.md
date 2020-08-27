# Gravitee Team : How I installed, and used `kube2pulumi`

```bash
jbl@poste-devops-jbl-16gbram:~/gio_poc/components/aws/networking$ curl -LO https://github.com/pulumi/kube2pulumi/releases/download/v0.0.3/kube2pulumi-v0.0.3-linux-amd64.tar.gz
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   650  100   650    0     0   2981      0 --:--:-- --:--:-- --:--:--  2968
100 9164k  100 9164k    0     0  6386k      0  0:00:01  0:00:01 --:--:-- 28.3M
jbl@poste-devops-jbl-16gbram:~/gio_poc/components/aws/networking$ tar -tf kube2pulumi-v0.0.3-linux-amd64.tar.gz
LICENSE
README.md
kube2pulumi
jbl@poste-devops-jbl-16gbram:~/gio_poc/components/aws/networking$ tar -xf kube2pulumi-v0.0.3-linux-amd64.tar.gz
jbl@poste-devops-jbl-16gbram:~/gio_poc/components/aws/networking$ ls -allh
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
jbl@poste-devops-jbl-16gbram:~/gio_poc/components/aws/networking$ ./kube2pulumi typescript -f ./rbac-role.yaml
Conversion successful! Generated File: index.ts
jbl@poste-devops-jbl-16gbram:~/gio_poc/components/aws/networking$ cat index.ts
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
jbl@poste-devops-jbl-16gbram:~/gio_poc/components/aws/networking$ cp index.ts generated-fargate-alb-rbac.ts && rm index.ts
```


# kube2pulumi

Convert Kubernetes YAML to Pulumi programs in Go, TypeScript, Python, and C#. Improve your Kubernetes development experience by taking advantage of strong types, compilation errors, full IDE support for features like autocomplete. Declare and manage the infrastructure in any cloud in the same program that manages your Kubernetes resources.

## Live Demo
Check out the [kube2pulumi web app](https://www.pulumi.com/kube2pulumi/) to see `kube2pulumi` in action in your browser.

## Prerequisites
1. [Pulumi CLI](https://pulumi.io/quickstart/install.html)
2. Install the Pulumi Kubernetes plugin:
```console
$ pulumi plugin install resource kubernetes v2.4.2
```

## Building and Installation

If you wish to use `kube2pulumi` without developing the tool itself, you can use one of the [binary
releases](https://github.com/pulumi/kube2pulumi/releases) hosted on GitHub.

### Homebrew
`kube2pulumi` can be installed on Mac from the Pulumi Homebrew tap.
```console
brew install pulumi/tap/kube2pulumi
```


kube2pulumi uses [Go modules](https://github.com/golang/go/wiki/Modules) to manage dependencies. If you want to develop `kube2pulumi` itself, you'll need to have [Go](https://golang.org/)  installed in order to build.
Once this prerequisite is installed, run the following to build the `kube2pulumi` binary and install it into `$GOPATH/bin`:

```console
$ go build -o $GOPATH/bin/kube2pulumi cmd/kube2pulumi/main.go
```

Go should automatically handle pulling the dependencies for you.

If `$GOPATH/bin` is not on your path, you may want to move the `kube2pulumi` binary from `$GOPATH/bin`
into a directory that is on your path.

## Usage

In order to use `kube2pulumi` to convert Kubernetes YAML to Pulumi and then deploy it,
you'll first need to install the [Pulumi CLI](https://pulumi.io/quickstart/install.html).

Once the
Pulumi CLI has been installed, you'll need to install the Kubernetes plugin:

```console
$ pulumi plugin install resource kubernetes v2.4.2
```

Now, navigate to the same directory as the the YAML you'd like to
convert and create a new Pulumi stack in your favorite language:

```console
// For a Go project
$ pulumi new kubernetes-go -f

// For a TypeScript project
$ pulumi new kubernetes-typescript -f

// For a Python project
$ pulumi new kubernetes-python -f

// For a C# project
$ pulumi new kubernetes-csharp -f
```

Then run `kube2pulumi` which will write a file in the directory that
contains the Pulumi project you just created:

```console
// For a Go project
$ kube2pulumi go

// For a TypeScript project
$ kube2pulumi typescript

// For a Python project
$ kube2pulumi python

// For a C# project
$ kube2pulumi csharp
```

This will generate a Pulumi  program that when run with `pulumi update` will deploy the
Kubernetes resources originally described by your YAML. Note that before deployment you will need to [configure Kubernetes](https://www.pulumi.com/docs/intro/cloud-providers/kubernetes/setup/) so the Pulumi CLI can connect to a Kubernetes cluster. If you have previously configured the [kubectl CLI](https://kubernetes.io/docs/reference/kubectl/overview/), `kubectl`, Pulumi will respect and use your configuration settings.

## Example

Let's convert a simple YAML file describing a pod with a single container running nginx:

```yaml
apiVersion: v1
kind: Pod
metadata:
  namespace: foo
  name: bar
spec:
  containers:
    - name: nginx
      image: nginx:1.14-alpine
      resources:
        limits:
          memory: 20Mi
          cpu: 0.2

```

### Go

```console
kube2pulumi go -f ./pod.yaml
```

```go
package main

import (
	corev1 "github.com/pulumi/pulumi-kubernetes/sdk/v2/go/kubernetes/core/v1"
	metav1 "github.com/pulumi/pulumi-kubernetes/sdk/v2/go/kubernetes/meta/v1"
	"github.com/pulumi/pulumi/sdk/v2/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		_, err := corev1.NewPod(ctx, "fooBarPod", &corev1.PodArgs{
			ApiVersion: pulumi.String("v1"),
			Kind:       pulumi.String("Pod"),
			Metadata: &metav1.ObjectMetaArgs{
				Namespace: pulumi.String("foo"),
				Name:      pulumi.String("bar"),
			},
			Spec: &corev1.PodSpecArgs{
				Containers: corev1.ContainerArray{
					&corev1.ContainerArgs{
						Name:  pulumi.String("nginx"),
						Image: pulumi.String("nginx:1.14-alpine"),
						Resources: &corev1.ResourceRequirementsArgs{
							Limits: pulumi.StringMap{
								"memory": pulumi.String("20Mi"),
								"cpu":    pulumi.String("0.2"),
							},
						},
					},
				},
			},
		})
		if err != nil {
			return err
		}
		return nil
	})
}
```

### TypeScript

```console
kube2pulumi typescript -f ./pod.yaml
```

```ts
import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

const fooBarPod = new kubernetes.core.v1.Pod("fooBarPod", {
    apiVersion: "v1",
    kind: "Pod",
    metadata: {
        namespace: "foo",
        name: "bar",
    },
    spec: {
        containers: [{
            name: "nginx",
            image: "nginx:1.14-alpine",
            resources: {
                limits: {
                    memory: "20Mi",
                    cpu: 0.2,
                },
            },
        }],
    },
});
```

### Python

```console
kube2pulumi python -f ./pod.yaml
```

```py
import pulumi
import pulumi_kubernetes as kubernetes

foo_bar_pod = kubernetes.core.v1.Pod("fooBarPod",
    api_version="v1",
    kind="Pod",
    metadata={
        "namespace": "foo",
        "name": "bar",
    },
    spec={
        "containers": [{
            "name": "nginx",
            "image": "nginx:1.14-alpine",
            "resources": {
                "limits": {
                    "memory": "20Mi",
                    "cpu": "0.2",
                },
            },
        }],
    })
```

### C#

```console
kube2pulumi csharp -f ./pod.yaml
```

```cs
using Pulumi;
using Kubernetes = Pulumi.Kubernetes;

class MyStack : Stack
{
    public MyStack()
    {
        var fooBarPod = new Kubernetes.Core.V1.Pod("fooBarPod", new Kubernetes.Types.Inputs.Core.V1.PodArgs
        {
            ApiVersion = "v1",
            Kind = "Pod",
            Metadata = new Kubernetes.Types.Inputs.Meta.V1.ObjectMetaArgs
            {
                Namespace = "foo",
                Name = "bar",
            },
            Spec = new Kubernetes.Types.Inputs.Core.V1.PodSpecArgs
            {
                Containers =
                {
                    new Kubernetes.Types.Inputs.Core.V1.ContainerArgs
                    {
                        Name = "nginx",
                        Image = "nginx:1.14-alpine",
                        Resources = new Kubernetes.Types.Inputs.Core.V1.ResourceRequirementsArgs
                        {
                            Limits =
                            {
                                { "memory", "20Mi" },
                                { "cpu", "0.2" },
                            },
                        },
                    },
                },
            },
        });
    }

}
```

# Limitations

`kube2pulumi` [currently does not handle the conversion of CustomResourceDefinitions or CustomResources](https://github.com/pulumi/kube2pulumi/issues/20). However, our
new tool `crd2pulumi`, creates strongly-typed args for a Resource based on your CRD! If using CRD/CR's make sure to check out the following tool!

1. [crd2pulumi README](https://github.com/pulumi/pulumi-kubernetes/blob/master/provider/cmd/crd2pulumi/README.md)
