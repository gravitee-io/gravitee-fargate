# IAM Roles and kubectl auth integration

## Automation

* Create `IAM Role` with desired permissions in the `Kubernetes` Cluster (e.g. permissions to `kubectl` desccribe, get, rollout, etc..., but not on `kube-system` namespace)
* For human _Bernard_, Create `IAM User`, and give this IAM user permissions to assume Role
* add Role entry into `aws-auth` configmap


## The scenario

cf. https://github.com/kubernetes-sigs/aws-iam-authenticator/issues/174#issuecomment-651031781

* In my team, we are N engineers working on a set of 2 clusters
* my colleague creates one cluster, I created another
* we use the same AWS profile (`~/.aws/credentials` etc...)
* but we have different aws users , and you can check that yourselves in your teams, with :

```bash
aws sts get-caller-identity | jq .Arn
```

* so to AWS IAM logon to the cluster my colleague created an IAM Role , and what we need, is "the ability the assume roles"
* So ok, now for that fist  step (adding / sharing cause I did not see that reference in the page) : https://aws.amazon.com/premiumsupport/knowledge-center/eks-api-server-unauthorized-error/


Ok, now look how you can make your situation clearer :
* You are AWS user `Bobby`),
* The AWS user `Ricky`, created the EKS cluster `the-good-life-cluster`
* And `Bobby`, wants to kubectl into `the-good-life-cluster`
* To do that, `Bobby` must be able to _assume_  `Ricky` 's AWS IAM Role : Why ? because we **do not** want anyone to be able to _impersonate_, any one else (not even the super admin ruling them all), for secruity accountability 's sake
* well you have your ideas here taking over the subject, so what you need, now, is to run this, to bite on it :

```bash
export RICKY_S_CREATED_EKS_CLUSTER_NAME=the-good-life-cluster
# AWS REGION where Ricky created his cluster
export AWS_REGION=eu-west-1
export BOBBY_S_BOURNE_ID=$(aws sts get-caller-identity | jq .Arn)
# So now, Bobby wants to kubectl into the Cluster Ricky created
# So Booby does this :
aws eks update-kubeconfig --name ${RICKY_S_CREATED_EKS_CLUSTER_NAME} --region ${AWS_REGION}
# and that does not fire up any error, so Bobby's happy and thinks he can
kubectl get all
# Ouch, Booby's now in dismay, he gets a "error: You must be logged in to the server (Unauthorized)" !
# Okay, Bobby now runs this :
aws eks update-kubeconfig --name ${RICKY_S_CREATED_EKS_CLUSTER_NAME} --region ${AWS_REGION} --role-arn ${BOBBY_S_BOURNE_ID}

kubectl get all

# And there you go, Now Bobby has an error, pretty explicit : He now knows how to test, whetjher or not, he can assume role of Ricky .. And there he smiles cause what he did, is trying to assume his own role !
# Got it , Bobby should assume role of Ricky, that way :
export RICKY_S_BOURNE_IDENTITY=$(Ricky will give you that one)


aws eks update-kubeconfig --name ${RICKY_S_CREATED_EKS_CLUSTER_NAME} --region ${AWS_REGION} --role-arn ${RICKY_S_BOURNE_IDENTITY}

```

I'll be glad to discuss this with anyone, and I 'll feedback when I have finished solving this issue

Note :

* `--role-arn ${RICKY_S_BOURNE_IDENTITY}` : `${RICKY_S_BOURNE_IDENTITY}` is the ARN of a User, not a role ... So to solve this you must  :
  * create an IAM role ,
  * give Bobby the permission to assume that new AWS IAM Role
  * and finally make sure that with this role you are allowed to perform the `kubectl` operations you desire (not necessarily ALL possible operations, I assume, If I may... :) ) : for this, you have to tell the cluster to give permissions to those IAM users who have the above discussed IAM Role, as mentioned in https://github.com/kubernetes-sigs/aws-iam-authenticator/issues/174#issuecomment-476442197 (very many thnak ou for that part, to @whereisaaron and @tobisanya for updating the link to AWS doc  https://github.com/kubernetes-sigs/aws-iam-authenticator/issues/174#issuecomment-619843325 ). So here below, the `kube-system` `aws-auth` ConfigMap shows how a two types of users where added to the configmap, using the `mapUsers` section, and how I mimicked EKS devops team to add an IAM Role, wchih allows the users to `kubectl` hit the K8S api  ( @nimdaconficker might help u...) :

```Yaml
# Please edit the object below. Lines beginning with a '#' will be ignored,
# and an empty file will abort the edit. If an error occurs while saving this file will be
# reopened with the relevant failures.
#
apiVersion: v1
data:
  mapRoles: |
    - rolearn: arn:aws:iam::555555555555:role/devel-worker-nodes-NodeInstanceRole-XXXXXXXXXXX
      username: system:node:{{EC2PrivateDNSName}}
      groups:
        - system:bootstrappers
        - system:nodes
# Don't EVER touch what is above : when you retrieve your [aws-auth] ConfigMap from your EKS Cluster
# this section above will  already be there, with values very specific to your cluster, and
# most importantly your cluster node's AWS IAM Role ARN
# so there below, added mapped users
# but what we want is to add a role, not a specific user (for hot user management), os
# let's do it like they did it at AWS, for the Cluster nodes IAM Role, but with
# groups such as admin and ops-user below
    - rolearn: WELL_YOU_KNOW_THE_ARN_OF_THE_ROLE_U_JUST_CREATED
      username: bobby
      groups:
        # bobby needs access to master ndes, to hit the K8S APi with kubectl, doesn't he? Sure he does.
        - system:masters
  mapUsers: |
    - userarn: arn:aws:iam::555555555555:user/admin
      username: admin
      groups:
        - system:masters
    - userarn: arn:aws:iam::111122223333:user/ops-user
      username: ops-user
      groups:
        - system:masters
```
  _Typical super admin / many devops_ setup, only it is just two users. found at https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html

  *  and there you go :

```bash
aws eks update-kubeconfig --name ${RICKY_S_CREATED_EKS_CLUSTER_NAME} --region ${AWS_REGION} --role-arn ${ARN_OF_THAT_NEW_ROLE_YOU_CREATED}
```


So, Roles only, no specific users (except a few only for senior devops, just in case) :
* because AWS IAM integration to cluster auth  : it's like an IPAM in linux and openssh ... (So we must work without mentioning any user, so that we do not exclude future users, or include them with zero work)
* so that you can manage users with federation, with very little dependencies, eg. with `keycloak`, why not ?


### More fine grained permissions now

* Okay, so the `- system:masters` thing, allows a user to `kubectl` into the cluster. Fine. But how mucc? Or, How do we, for eample , frobid him to update any resource read-only) ? Or hpw to we restrict his permissions ?
* first, and according [this AWS doc. page](https://aws.amazon.com/premiumsupport/knowledge-center/eks-api-server-unauthorized-error/) , `- system:masters` will allow to do anything, in that cluster : so that the maximum
* then, we can find permission restrictions examples at https://kubernetes.io/docs/reference/access-authn-authz/rbac/#default-roles-and-role-bindings , and let's mention a few :
  * (work in progress, but I am working on https://rtfm.co.ua/en/kubernetes-part-5-rbac-authorization-with-a-role-and-rolebinding-example/ if you are interested )
  * (to be continued)

Refs. :

* https://kubernetes.io/docs/reference/access-authn-authz/rbac/#default-roles-and-role-bindings
* https://aws.amazon.com/premiumsupport/knowledge-center/eks-api-server-unauthorized-error/


### (See my aws-auth `ConfigMap`)

```bash
jbl@poste-devops-jbl-16gbram:~/gravitee-init-std-op$ kubectl get configmap/aws-auth --namespace kube-system
NAME       DATA   AGE
aws-auth   1      19d
jbl@poste-devops-jbl-16gbram:~/gravitee-init-std-op$ kubectl describe configmap/aws-auth --namespace kube-system
Name:         aws-auth
Namespace:    kube-system
Labels:       app.kubernetes.io/managed-by=pulumi
Annotations:
Data
====
mapRoles:
----
- groups:
  - system:bootstrappers
  - system:nodes
  rolearn: arn:aws:iam::XXXXXXXXXX:role/my-cluster-gateway-profile-role
  username: system:node:{{EC2PrivateDNSName}}
- groups:
  - system:bootstrappers
  - system:nodes
  rolearn: arn:aws:iam::XXXXXXXXXX:role/my-cluster-front-profile-role
  username: system:node:{{EC2PrivateDNSName}}
- groups:
  - system:bootstrappers
  - system:nodes
  rolearn: arn:aws:iam::XXXXXXXXXX:role/my-cluster-back-profile-role
  username: system:node:{{EC2PrivateDNSName}}
- groups:
  - system:bootstrappers
  - system:nodes
  rolearn: arn:aws:iam::XXXXXXXXXX:role/my-cluster-system-profile-role
  username: system:node:{{EC2PrivateDNSName}}

Events:  <none>


Events:  <none>
```

( `XXXXXXXXXX` is me obfuscating a value that any way, will be different for you )


# Final update : success

Alright, what you cna read above was just tested functional so help yourselves (and can we close the issue ? @EppO @mortent @Atoms @flaper87 @joonas  ?

update : I beg you pardon for the solution I gave does not answer the original issue, which was the case of a user trying to kubectl against a cluster he created himself
