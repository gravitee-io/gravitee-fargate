# `Gravitee` on Fargate : the `AWS ALB`


* `AWS` 's `ALB` is a standard K8S `Ingress Controller`,
* and for every application `myapplication` that should be made available through the `ALB`, all you need to do is :
  * to add an `Ingress`, to your `myapplication` K8S deployment
  * add 2 K8S `annotation`s on the `myapplication` K8S `Ingress` :
    * `"kubernetes.io/ingress.class": "alb"` : this first `annotation` makes the ALB `IngressController`, instantiate deployed application 's `Ingress`  (an `Ingress Controller` "instantiates" an `Ingress`, deploying an `Ingress` alone does nothing at at all).
    * `"alb.ingress.kubernetes.io/scheme": "internet-facing"`:  This second K8S annotation is obvious, it tells the `ALB` to make the deployed app available from the internet
* So `Gravitee APIM` has to be deployed with an `Ingress`, instead of a Traefik IngressRoute CRD and Gravitee's  Ingress has to be annotated  with   `"kubernetes.io/ingress.class": "alb"` and `"alb.ingress.kubernetes.io/scheme": "internet-facing"` .
* This is a procedure for an `EKS` Cluster, not especially meant for an `EKS` Cluster with `Fargate` integration, see [pulumi doc example here](https://www.pulumi.com/blog/kubernetes-ingress-with-aws-alb-ingress-controller-and-pulumi-crosswalk/)
* As mentioned on [this AWS doc page](https://aws.amazon.com/blogs/containers/using-alb-ingress-controller-with-amazon-eks-on-fargate/), In the context of an `AWS EKS` Cluster, with `Fargate` integration, additionnaly to the 2 previously described K8S `annotation`s on deployed application's Ingress, it is required to add another K8S annotation on the deployed application K8S Service : `alb.ingress.kubernetes.io/target-type: ip` .
* Also [this AWS doc page](https://aws.amazon.com/blogs/containers/using-alb-ingress-controller-with-amazon-eks-on-fargate/) confirms the [pulumi doc example](https://www.pulumi.com/blog/kubernetes-ingress-with-aws-alb-ingress-controller-and-pulumi-crosswalk/) confirms [pulumi doc example here](https://www.pulumi.com/blog/kubernetes-ingress-with-aws-alb-ingress-controller-and-pulumi-crosswalk/) :
  * exact same  `AWS IAM policy` from https://raw.githubusercontent.com/kubernetes-sigs/aws-alb-ingress-controller/master/docs/examples/iam-policy.json
  * mentions the exact same K8S `annotation` : `"kubernetes.io/ingress.class": "alb"` and `"alb.ingress.kubernetes.io/scheme": "internet-facing"`



You `AWS` Application Load Balancer being deployed as a simple `Helm Chart`, you may configure all its values using its `values.yaml`, have a look :
* at [components/aws/networking/aws-alb-ingress-controller/values.yaml] in this repo.
* and at https://github.com/kubernetes-sigs/aws-alb-ingress-controller
