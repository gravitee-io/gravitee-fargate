# Some `AWS` issues the `Gravitee` Team has experienced

This page lists all issues experienced by the Gravitee Team, on AWS EKS, in the context of Fargate integration.

The oldest ones are at the bottom of this page, and the most recent on top.



### Fargate Scheduler issue

_**Status [`being processed`] - Case ID: `7321511841`**_ : Issue being processed by AWS `eu-west-1` Support Team

Gravitee Team has currently opened a case at AWS on `eu-west-1` AWS Region, regarding Fargate Scheduler not Scheduling Pods, in August `2020`, referenced with ID `` :

* Depending on the AWS region you are working in, You may experience the same issue, and Gravitee Team :
   * recommends you open a Case specific to your organization, to ensure AWSD Team deals with your specific infrastructure (there can always be specificity from one region/AZ to another, in the AWS underlay)
   * will keep you informed on the support Case opened by Gravitee on `Gravitee` Slack

_**Issue details**_ :

* Context : an `EKS` Kubernetes Cluster, with `Fargate Profile`
* Expected Behavior : that the `graviteeio-stack-apim3-api` pods are Scheduled to run on `Fargate` by the Fargate Scheduler,
* Actual Behavior : the Fargate Scheduler does not shcedule the desired pods.
* Note : the Fargate Profile Full Detials displayed with AWS CLI in above output
* The reference Cluster for this test is : https://eu-west-1.console.aws.amazon.com/eks/home?region=eu-west-1#/clusters/gioEKSCluster-eksCluster-e69631b
* The test :


```bash
export AWS_PROFILE=gio_poc
export AWS_REGION=eu-west-1

aws iam get-user


export CLUSTER_NAME=$(aws eks list-clusters --region=eu-west-1 | jq '.clusters[0]' | awk -F '"' '{print $2}')

aws eks list-fargate-profiles --cluster ${CLUSTER_NAME}


export FARGATE_PROFILE_NAME=$(aws eks list-fargate-profiles --cluster ${CLUSTER_NAME} | jq '.fargateProfileNames[0]' | awk -F '"' '{print $2}')

echo "My EKS Clsuster name is : [${CLUSTER_NAME}]"
echo "My Fargate profile name is : [${FARGATE_PROFILE_NAME}]"

date

kubectl label svc graviteeio-stack-apim3-api eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
kubectl label svc graviteeio-stack-apim3-gateway eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
kubectl label svc graviteeio-stack-apim3-ui eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
kubectl label svc graviteeio-stack-apim3-portal eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite

kubectl label svc graviteeio-stack-apim3-api graviteefargate=serverless --overwrite
kubectl label svc graviteeio-stack-apim3-gateway graviteefargate=serverless --overwrite
kubectl label svc graviteeio-stack-apim3-ui graviteefargate=serverless --overwrite
kubectl label svc graviteeio-stack-apim3-portal graviteefargate=serverless --overwrite

# Also tested to label pods directly
kubectl get pods -n default -l app.kubernetes.io/name=apim3

date
kubectl label pod graviteeio-stack-apim3-api-585d6b4458-bl72c eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
kubectl label pod graviteeio-stack-apim3-gateway-6c6c967f44-bn5cx eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
kubectl label pod graviteeio-stack-apim3-portal-7bccb4fd88-zl2gz eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
kubectl label pod graviteeio-stack-apim3-ui-8546555565-2c894 eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite

kubectl label pod graviteeio-stack-apim3-api-585d6b4458-bl72c graviteefargate=serverless --overwrite
kubectl label pod graviteeio-stack-apim3-gateway-6c6c967f44-bn5cx graviteefargate=serverless --overwrite
kubectl label pod graviteeio-stack-apim3-portal-7bccb4fd88-zl2gz graviteefargate=serverless --overwrite
kubectl label pod graviteeio-stack-apim3-ui-8546555565-2c894 graviteefargate=serverless --overwrite

# wait a bit (5 min)
sleep 300s

date
kubectl get pods,svc,cm -n default
# and in the events :
kubectl describe pods -l app.kubernetes.io/name=apim3 | grep -A10 Events

```

* test output :

```bash
$ # NEW TEST
$ aws iam get-user
{
    "User": {
        "Path": "/",
        "UserName": "postnl_bot",
        "UserId": "AIDA3PLWCK7XLULBTFBLA",
        "Arn": "arn:aws:iam::788910987246:user/postnl_bot",
        "CreateDate": "2020-08-19T21:03:14+00:00",
        "Tags": [
            {
                "Key": "postnl",
                "Value": "pulumi_bot"
            }
        ]
    }
}
$
$
$ export CLUSTER_NAME=$(aws eks list-clusters --region=eu-west-1 | jq '.clusters[0]' | awk -F '"' '{print $2}')
$
$ aws eks list-fargate-profiles --cluster ${CLUSTER_NAME}
{
    "fargateProfileNames": [
        "giofargateprofile-3402384"
    ]
}
$
$
$ export FARGATE_PROFILE_NAME=$(aws eks list-fargate-profiles --cluster ${CLUSTER_NAME} | jq '.fargateProfileNames[0]' | awk -F '"' '{print $2}')
$
$ echo "My EKS Clsuster name is : [${CLUSTER_NAME}]"
My EKS Clsuster name is : [gioEKSCluster-eksCluster-e69631b]
$ echo "My Fargate profile name is : [${FARGATE_PROFILE_NAME}]"
My Fargate profile name is : [giofargateprofile-3402384]
$
$ date
Thu 27 Aug 2020 11:00:51 PM CEST
$
$ kubectl label svc graviteeio-stack-apim3-api eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
service/graviteeio-stack-apim3-api not labeled
$ kubectl label svc graviteeio-stack-apim3-gateway eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
service/graviteeio-stack-apim3-gateway not labeled
$ kubectl label svc graviteeio-stack-apim3-ui eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
service/graviteeio-stack-apim3-ui not labeled
$ kubectl label svc graviteeio-stack-apim3-portal eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
service/graviteeio-stack-apim3-portal not labeled
$
$ kubectl label svc graviteeio-stack-apim3-api graviteefargate=serverless --overwrite
service/graviteeio-stack-apim3-api not labeled
$ kubectl label svc graviteeio-stack-apim3-gateway graviteefargate=serverless --overwrite
service/graviteeio-stack-apim3-gateway not labeled
$ kubectl label svc graviteeio-stack-apim3-ui graviteefargate=serverless --overwrite
service/graviteeio-stack-apim3-ui not labeled
$ kubectl label svc graviteeio-stack-apim3-portal graviteefargate=serverless --overwrite
service/graviteeio-stack-apim3-portal not labeled
$
$ # Also tested to label pods directly
$ kubectl get pods -n default -l app.kubernetes.io/name=apim3
NAME                                              READY   STATUS    RESTARTS   AGE
graviteeio-stack-apim3-api-585d6b4458-bl72c       0/1     Pending   0          172m
graviteeio-stack-apim3-gateway-6c6c967f44-bn5cx   0/1     Pending   0          172m
graviteeio-stack-apim3-portal-7bccb4fd88-zl2gz    0/1     Pending   0          172m
graviteeio-stack-apim3-ui-8546555565-2c894        0/1     Pending   0          172m
$
$ date
Thu 27 Aug 2020 11:01:00 PM CEST
$ kubectl label pod graviteeio-stack-apim3-api-585d6b4458-bl72c eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
pod/graviteeio-stack-apim3-api-585d6b4458-bl72c labeled
$ kubectl label pod graviteeio-stack-apim3-gateway-6c6c967f44-bn5cx eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
pod/graviteeio-stack-apim3-gateway-6c6c967f44-bn5cx labeled
$ kubectl label pod graviteeio-stack-apim3-portal-7bccb4fd88-zl2gz eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
pod/graviteeio-stack-apim3-portal-7bccb4fd88-zl2gz labeled
$ kubectl label pod graviteeio-stack-apim3-ui-8546555565-2c894 eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME} --overwrite
pod/graviteeio-stack-apim3-ui-8546555565-2c894 labeled
$
$ kubectl label pod graviteeio-stack-apim3-api-585d6b4458-bl72c graviteefargate=serverless --overwrite
pod/graviteeio-stack-apim3-api-585d6b4458-bl72c labeled
$ kubectl label pod graviteeio-stack-apim3-gateway-6c6c967f44-bn5cx graviteefargate=serverless --overwrite
pod/graviteeio-stack-apim3-gateway-6c6c967f44-bn5cx labeled
$ kubectl label pod graviteeio-stack-apim3-portal-7bccb4fd88-zl2gz graviteefargate=serverless --overwrite
pod/graviteeio-stack-apim3-portal-7bccb4fd88-zl2gz labeled
$ kubectl label pod graviteeio-stack-apim3-ui-8546555565-2c894 graviteefargate=serverless --overwrite
pod/graviteeio-stack-apim3-ui-8546555565-2c894 labeled
$
$ # wait a bit (5 min)
$ sleep 300s
$
$ date
Thu 27 Aug 2020 11:06:06 PM CEST
$ kubectl get pods,svc,cm -n default
NAME                                                  READY   STATUS    RESTARTS   AGE
pod/alb-aws-alb-ingress-controller-8c6f4ddb-fk478     0/1     Pending   0          177m
pod/graviteeio-stack-apim3-api-585d6b4458-bl72c       0/1     Pending   0          177m
pod/graviteeio-stack-apim3-gateway-6c6c967f44-bn5cx   0/1     Pending   0          177m
pod/graviteeio-stack-apim3-portal-7bccb4fd88-zl2gz    0/1     Pending   0          177m
pod/graviteeio-stack-apim3-ui-8546555565-2c894        0/1     Pending   0          177m

NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
service/graviteeio-stack-apim3-api       ClusterIP   172.20.187.22    <none>        83/TCP     177m
service/graviteeio-stack-apim3-gateway   ClusterIP   172.20.221.239   <none>        82/TCP     177m
service/graviteeio-stack-apim3-portal    ClusterIP   172.20.32.246    <none>        8003/TCP   177m
service/graviteeio-stack-apim3-ui        ClusterIP   172.20.198.218   <none>        8002/TCP   177m
service/kubernetes                       ClusterIP   172.20.0.1       <none>        443/TCP    3h1m

NAME                                       DATA   AGE
configmap/graviteeio-stack-apim3-api       1      177m
configmap/graviteeio-stack-apim3-gateway   1      177m
configmap/graviteeio-stack-apim3-portal    4      177m
configmap/graviteeio-stack-apim3-ui        4      177m
$ # and in the events :
$ kubectl describe pods -l app.kubernetes.io/name=apim3 | grep -A10 Events
Events:
  Type     Reason            Age                     From               Message
  ----     ------            ----                    ----               -------
  Warning  FailedScheduling  2m27s (x131 over 177m)  default-scheduler  no nodes available to schedule pods


Name:           graviteeio-stack-apim3-gateway-6c6c967f44-bn5cx
Namespace:      default
Priority:       0
Node:           <none>
Labels:         app.kubernetes.io/component=gateway
--
Events:
  Type     Reason            Age                     From               Message
  ----     ------            ----                    ----               -------
  Warning  FailedScheduling  2m28s (x128 over 177m)  default-scheduler  no nodes available to schedule pods


Name:           graviteeio-stack-apim3-portal-7bccb4fd88-zl2gz
Namespace:      default
Priority:       0
Node:           <none>
Labels:         app.kubernetes.io/component=portal
--
Events:
  Type     Reason            Age                     From               Message
  ----     ------            ----                    ----               -------
  Warning  FailedScheduling  2m28s (x130 over 177m)  default-scheduler  no nodes available to schedule pods


Name:           graviteeio-stack-apim3-ui-8546555565-2c894
Namespace:      default
Priority:       0
Node:           <none>
Labels:         app.kubernetes.io/component=ui
--
Events:
  Type     Reason            Age                   From               Message
  ----     ------            ----                  ----               -------
  Warning  FailedScheduling  58s (x129 over 177m)  default-scheduler  no nodes available to schedule pods
$

```




### Pulumi fails to delete Network resources

_**Status [`solved`] - Case ID: `7319725671`**_ : Issue has been `solved` by AWS `eu-west-1` Support Team

We encoutered classical inconsistent states in resources, picked up by Pulumi, and confirmed with manual test

_Pulumi errors_ :

```bash
Destroying (gio):
     Type                        Name                                      Status                  Info
     pulumi:pulumi:Stack         prod-giooperator-gio            **failed**              1 error
 -   ├─ aws:ec2:InternetGateway  gio_vpc                                **deleting failed**     1 error
 -   ├─ aws:ec2:SecurityGroup    gioEKSCluster-eksClusterSecurityGroup  deleted
 -   ├─ aws:ec2:Subnet           gio_vpc-gioPOCVpcPubNet-public-1    **deleting failed**     1 error
 -   └─ aws:ec2:Eip              gio_vpc-1                              **deleting failed**     1 error

Diagnostics:
  aws:ec2:Subnet (gio_vpc-gioPOCVpcPubNet-public-1):
    error: deleting urn:pulumi:gio::prod-giooperator::awsx:x:ec2:Vpc$awsx:x:ec2:Subnet$aws:ec2/subnet:Subnet::gio_vpc-gioPOCVpcPubNet-public-1: error deleting subnet (subnet-00c69e984c71bc14d): timeout while waiting for state to become 'destroyed' (last state: 'pending', timeout: 20m0s)

  aws:ec2:Eip (gio_vpc-1):
    error: deleting urn:pulumi:gio::prod-giooperator::awsx:x:ec2:Vpc$awsx:x:ec2:NatGateway$aws:ec2/eip:Eip::gio_vpc-1: AuthFailure: You do not have permission to access the specified resource.
    	status code: 400, request id: 07d175e9-19e8-42fe-8afb-9327736ad67a

  aws:ec2:InternetGateway (gio_vpc):
    error: deleting urn:pulumi:gio::prod-giooperator::awsx:x:ec2:Vpc$awsx:x:ec2:InternetGateway$aws:ec2/internetGateway:InternetGateway::gio_vpc: Error waiting for internet gateway (igw-07138d3aaacd2b30e) to detach: timeout while waiting for state to become 'detached' (last state: 'detaching', timeout: 15m0s)

  pulumi:pulumi:Stack (prod-giooperator-gio):
    error: update failed

Resources:
    - 1 deleted

Duration: 20m5s

```

_Manual Fix which failed_

Running `pulumi destroy` command gave us errors deleting some resources.

* With `Pulumi` error messages, we determined which resources failed to be deleted.
* We then tried to go to `AWS` `Web UI` console, to delete them manually, whatever operations we may try, we are not allowed to conduct operation, due to lack of permissions.

* Flow I used to try and delete those resources using AWS Web UI Console :
  * I try an diassociate `EIP` from `NatGateway`
  * I Release `EIP`
  * I try an diassociate `EIP` from `Internet Gateway`
  * I Release `EIP`
  * I detach `Internet Gateway` from VPC
  * I delete `Internet Gateway`
  * I delete VPC

* We opened support case with references for those resources, below example about `EIP`, `Internet Gateway`, and VPC :
  * `EIP` : https://eu-west-1.console.aws.amazon.com/vpc/home?region=eu-west-1#ElasticIpDetails:AllocationId=eipalloc-015fc8917e080b57a
  * `Internet Gateway` : https://eu-west-1.console.aws.amazon.com/vpc/home?region=eu-west-1#InternetGateway:internetGatewayId=igw-07138d3aaacd2b30e
  * VPC : https://eu-west-1.console.aws.amazon.com/vpc/home?region=eu-west-1#vpcs:VpcId=vpc-00f68d14e0ed5918b

Note : we tried deleting those, with the above mentioned flow, while Pulumi was _not_ running, just to make sure no interference, same behaviour.



_**Referenced AWS opened Support Case**_ :

>
> Thank you for contacting Amazon Web Services.
>
> We have opened case `7319725671` to address your issue.
>
> The details of your case are as follows:
>
> Case ID: `7319725671`
> Subject: Not allowed to do any operation on `EIP` I created my self, logged in with my AWS root user
> Severity: Low
>
>

* We ran into an issue where `Pulumi` failed to delete some Network resources,
* and going to `AWS` console Web UI, manually deleting those resources fails as well, with error message :

>
> XXXXXXXXXX could not be disassociated.
> XXXXXXXXXX XXXXXXXXXX You do not have permission to access the specified resource.
>

* For example :

>
> Elastic IP address could not be disassociated.
> Elastic IP address 63.34.79.149 You do not have permission to access the specified resource.
>
