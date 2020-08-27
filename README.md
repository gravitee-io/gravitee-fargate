[![Gravitee IO](documentation/images/gravitee.png)](https://gravitee.io)

# `Gravitee` on AWS `EKS` with `Fargate` integration

This is a boilerplate to help quickly provision Gravtiee on AWS EKS, with Fargate integration


Main steps :

* (Step 1) First, you will setup your envrionment : install and configure all tools
* (Step 2) You will then create a `Pulumi` Project, and a `pulumi` stack, to run this boilerplate.
* (Step 3) You will run the `pulumi up` command : this will provision the components listed in the below _Bill Of Material B.O.M_
* (Step 4) Finally, you will want to `kubectl` into your `AWS` `EKS` Cluster, and you will label the Compoenents you want to run them on `Fargate`

_**B.O.M (Bill Of Material)**_

* An `AWS` `EKS` Cluster, with [Fargate Integration](./documentation/fargate)
* The [`Gravitee APIM` Community Edition Stack](https://docs.gravitee.io/apim/3.x/apim_overview_introduction.html), consisting of 4 components :
  * The `Gravitee APIM Gateway`
  * The `Gravitee APIM API`
  * The `Gravitee APIM Management UI`
  * The `Gravitee APIM Portal UI` : used by API consumers to subscribe to plans.
* An [AWS ALB (Application Load Balancer)](./documentation/aws-alb), which exposes 2 of the 4 components :
  * The `Gravitee APIM Gateway` : the API Gateway to hit to consume APIs  managed by `Gravitee APIM`
  * The `Gravitee APIM Portal UI` : The Gravitee Portal used by API consumers to subscribe to plans.
  * The `Gravitee APIM API` : not exposed, used only by admin Staff, and accessed with `kubectl port-forward`
  * The `Gravitee APIM Management UI` : not exposed, used only by admin Staff, and accessed with `kubectl port-forward`

## Step 1: Devops Environment Setup

The whole environment includes the following executables to install :

* `nodejs` : https://nodejs.org/en/download/package-manager/
* `npm` : comes with nodejs
* `typescript` npm package to get `tsc` : `npm install typescript -g`
* `pulumi` : https://www.pulumi.com/docs/get-started/install/
* `kubectl` : https://kubernetes.io/docs/tasks/tools/install-kubectl/
* `AWS CLI v2` :  https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html
* `Helm v3` (optional, useful to quickly test hel deployments to your cluster) : https://helm.sh/docs/intro/install/

* Reference versions for this stack :

```bash
$ uname -a
Linux poste-devops-jbl-16gbram 4.9.0-7-amd64 #1 SMP Debian 4.9.110-3+deb9u2 (2018-08-13) x86_64 GNU/Linux
$ pulumi version
v2.9.0
$ node --version
v14.4.0
$ npm --version
6.14.7
$ tsc --version
Version 3.9.5
$ kubectl version --client
Client Version: version.Info{Major:"1", Minor:"18", GitVersion:"v1.18.0", GitCommit:"9e991415386e4cf155a24b1da15becaa390438d8", GitTreeState:"clean", BuildDate:"2020-03-25T14:58:59Z", GoVersion:"go1.13.8", Compiler:"gc", Platform:"linux/amd64"}
$ helm version
version.BuildInfo{Version:"v3.2.0", GitCommit:"e11b7ce3b12db2941e90399e874513fbd24bcb71", GitTreeState:"clean", GoVersion:"go1.13.10"}
$ aws --version
aws-cli/2.0.5 Python/3.7.3 Linux/4.9.0-7-amd64 botocore/2.0.0dev9
$
```
* compare yours :
```bash
uname -a
pulumi version
node --version
npm --version
tsc --version
kubectl version --client
helm version
aws --version
```

* `AWS CLI v2` setup
  * installation : https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html
  * Create an AWS as shown in screenshots in `./documentation/aws-team-mgmt/users` folder. After the AWS user creation on aws console webui, you will get `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in a `csv` file.
  * prepare your aws credentials and config :

```bash
# ~/.aws/credentials

export AWS_PROFILE=gio_fargate
export AWS_REGION=eu-west-1
mkdir -p  ~/.aws
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/FAKEFAKE/FAKEFAKE
cat << EOF > ${HOME}/.aws/tcredentials
[${AWS_PROFILE}]
aws_access_key_id=${AWS_ACCESS_KEY_ID}
aws_secret_access_key=${AWS_SECRET_ACCESS_KEY}
EOF

# ~/.aws/config

cat << EOF > ${HOME}/.aws/tconfig
[${AWS_PROFILE}]
region=${AWS_REGION}
output=json
EOF

aws iam get-user | jq .

```

## Step 2: Create Your `Pulumi` project and stack

  * Install `Pulumi` CLI
  * Always update `Pulumi` CLI :

```bash
# installs or updates pulumi CLI
curl -fsSL https://get.pulumi.com | sh
```
  * go to pulumi webui, then to your pulumi user accont settings, generate a pulumi access token, and :

```bash
# you create the pulumi token with web ui
export YOUR_PULUMI_TOKEN=<your value here>

# ---
# my pulumi username is same as my Github username : I
# registered new pulumi user with my personal github account
#
export YOUR_PULUMI_USERNAME='Jean-Baptiste-Lasselle'

# installs / updates pulumi CLI
curl -fsSL https://get.pulumi.com | sh
# ~/.pulumi/  should exist
# mkdir -p  ~/.pulumi

cat << EOF > ${HOME}/.pulumi/credentials.json
{
    "current": "https://api.pulumi.com",
    "accessTokens": {
        "https://api.pulumi.com": "${YOUR_PULUMI_TOKEN}"
    },
    "accounts": {
        "https://api.pulumi.com": {
            "accessToken": "${YOUR_PULUMI_TOKEN}",
            "username": "${YOUR_PULUMI_USERNAME}"
        }
    }
}
EOF

# silently pulumi login based on [~/.pulumi/credentials.json]
pulumi login

```

* Now, git clone this recipe, and create a new pulumi _Project_, and a first `Pulumi` _stack_  :

```bash
# folder must be empty
export UR_PROJECT_HOME=$(pwd)/gravitee-on-fargate
export PULUMI_PROJECT_NAME=gio_on_fargate
export PULUMI_STACK_NAME=dev
export PULUMI_STACK_NAME=prod
export PULUMI_STACK_NAME=staging

git clone https://github.com/gravitee-io/gravitee-fargate ${UR_PROJECT_HOME}

cd ${UR_PROJECT_HOME}

# this will be interactive
pulumi new aws-typescript -n ${PULUMI_PROJECT_NAME} -s ${PULUMI_STACK_NAME}

# Use [--secrets-provider] option to use your own secret manager , instead
# of Pulumi's default secret manager
# pulumi new aws-typescript -n ${PROJECT_NAME} -s ${PULUMI_STACK_NAME} --secrets-provider hashivault
pulumi login
```

## Step 2: Run the `Pulumi` to terraform the `Gravitee` Stack


* Now you have your env setup, so you can run the `Pulumi` to terraform the `Gravitee` Stack :

```bash
export PULUMI_PROJECT_NAME=gio_on_fargate
export PULUMI_STACK_NAME=dev
export PULUMI_STACK_NAME=prod
export PULUMI_STACK_NAME=staging

export AWS_PROFILE=gio_fargate
export AWS_REGION=eu-west-1

pulumi login
npm i @pulumi/eks @pulumi/kubernetes @pulumi/kubernetesx --save
npm install
tsc

export MONGO_GIO_DB_NAME=graviteedb
export MONGO_HOST=54.228.103.148
export MONGO_PORT=27017
export MONGO_URI_PROTOCOL='mongodb+srv'

# Those below set configuration values for the Pulumi Stack you work on.
pulumi config set aws:profile "${AWS_PROFILE}" --stack "${PULUMI_STACK_NAME}"
pulumi config set aws:region "${AWS_REGION}" --stack "${PULUMI_STACK_NAME}"
# "postnl:k8s_namespace" will configure the k8S namespace in which PostNL deployments are going to go
pulumi config set ${PULUMI_PROJECT_NAME}:corporate_domain_name: mycompany.io
pulumi config set ${PULUMI_PROJECT_NAME}:desired_fargate_profile_name: giofargateprofile
pulumi config set ${PULUMI_PROJECT_NAME}:elastic_endpoint: http://54.228.103.148:9200
pulumi config set ${PULUMI_PROJECT_NAME}:gravitee_apim_chart_version: 3.0.4
pulumi config set ${PULUMI_PROJECT_NAME}:gravitee_apim_helm_chart_repo_id: apim3
pulumi config set ${PULUMI_PROJECT_NAME}:gravitee_apim_helm_release_name: graviteeio-stack
pulumi config set ${PULUMI_PROJECT_NAME}:gravitee_containers_tag: 3.1.1
pulumi config set ${PULUMI_PROJECT_NAME}:k8s_namespace: default
# Do not change the 2 port no. [8383] and [8002] :
# 2 Gravitee components are configured to be accessible only by admin staff
# using kubectl (so they are protected by KUBECONFIG)
# cf. [components/kubernetes/GraviteeAPIMKube.ts]
pulumi config set ${PULUMI_PROJECT_NAME}:kubectl_port_forward_mgmt_api: "8383"
pulumi config set ${PULUMI_PROJECT_NAME}:kubectl_port_forward_mgmt_ui: "8002"
# sets the name of the mongodb Database name Gravitee will use
pulumi config set ${PULUMI_PROJECT_NAME}:mongo_db_name: ${MONGO_GIO_DB_NAME}
pulumi config set ${PULUMI_PROJECT_NAME}:mongo_host: ${MONGO_HOST}
pulumi config set ${PULUMI_PROJECT_NAME}:mongo_port: "${MONGO_PORT}"
pulumi config set ${PULUMI_PROJECT_NAME}:mongo_uri_protocol: "${MONGO_URI_PROTOCOL}"
# sets the K8S anmespace to which Gravitee will be deployed
pulumi config set ${PULUMI_PROJECT_NAME}:k8s_namespace: default

# this will be a preview (dry run)
tsc && pulumi preview -s gio_fargate

# To actually run the recipe (NOT A DRY RUN WARNING, interactive) :
pulumi up -s "${PULUMI_STACK_NAME}"
# Other optiosn ( --yes to confirm silently)
# pulumi up --yes -s "${PULUMI_STACK_NAME}"
# Now to destroy everything
# pulumi destroy --yes -s "${PULUMI_STACK_NAME}"
# to destroy and re build again the Whole Stack :
# pulumi destroy --yes -s "${PULUMI_STACK_NAME}" && pulumi up --yes -s "${PULUMI_STACK_NAME}"

```
* The `pulumi` will run for while , approwimately 10 to 15 minutes, to create all resources.
* `Pulumi` will output warnings that Graviteeio components did not start : that is normal, Fargate Scheduler
* Once `pulumi` completed, to `kubectl` into your new EKS Fargate Kubernetes Cluster, run :
```bash
export AWS_PROFILE=gio_fargate
# the AWS Region you operate your cloud on
export AWS_REGION=eu-west-1

aws eks list-clusters --region ${AWS_REGION}
export CLUSTER_NAME=$(aws eks list-clusters --region=eu-west-1 | jq '.clusters[0]' | awk -F '"' '{print $2}')
aws eks update-kubeconfig --name ${CLUSTER_NAME} --region ${AWS_REGION}

kubectl cluster-info
```

## Step 1: Schedule `Gravitee` to run on `Fargate`

* Now, you have all your Gravitee components, in a `pending` state, and to make them run on Fargate, we must label their K8S services and pods :
  * with the `graviteeio/serverless: fargate` label, designed by gravitee team
  * with the AWS label `'eks.amazonaws.com/fargate-profile: <name of your fargate profile>`.

* You can check the name of your fargate profile using the AWS Web UI, in the `EKS` (not `ECS`) section of you AWS Dashboard.  Select your cluster, and browse to the "`Compute`" menu for your cluster, this should look like this :

![compute menu on EKS Cluster](./documentation/fargate/AWS_DASHBOARD_EKS_COMPUTE_MENU.png)

* And see details of your Cluster's **Fargate Profile**. Here below you can see the fargate scheduler "pod selector" created by this boiler plate in your Fargate Profile, (the `graviteeio/serverless: fargate` label, designed by the `Gravitee` Team) :

![Fargate profile details menu on `EKS` Cluster](./documentation/fargate/AWS_DASHBOARD_EKS_FARGATE_PROFILE_DETAILS.png)

* And you can surely check you fargate profile name , using `AWS CLI` :

```bash

* List and inspect fargate profiles for your cluster :

```bash
export AWS_PROFILE=<you AWS profile name>
export AWS_REGION=eu-west-1

export CLUSTER_NAME=$(aws eks list-clusters --region=eu-west-1 | jq '.clusters[0]' | awk -F '"' '{print $2}')

aws eks list-fargate-profiles --cluster ${CLUSTER_NAME}


export FARGATE_PROFILE_NAME=$(aws eks list-fargate-profiles --cluster ${CLUSTER_NAME} | jq '.fargateProfileNames[0]' | awk -F '"' '{print $2}')

echo "My EKS Clsuster name is : [${CLUSTER_NAME}]"
echo "My Fargate profile name is : [${FARGATE_PROFILE_NAME}]"

# aws eks describe-fargate-profile --cluster ${CLUSTER_NAME} --fargate-profile-name ${FARGATE_PROFILE_NAME}

```


  * with this kubectl syntax :

```bash
# Fargate Scheduler

kubectl label svc graviteeio-stack-apim3-api 'eks.amazonaws.com/fargate-profile'='giofargateprofile' --overwrite
kubectl label svc graviteeio-stack-apim3-api 'eks.amazonaws.com/fargate-profile'='giofargateprofile' --overwrite
kubectl label svc graviteeio-stack-apim3-api 'graviteeio/serverless'='fargate' --overwrite


```
* After labelling them, a Fargate Scheduler will see the labels, and will consequently schedule them to run on Fargate : this will take a few minutes, docker pull and Container CReating ...


## ANNEX: Known Issues of `AWS` `Fargate`


AWS EKS Fargate Integration is very young (`December 2019`), and it is not unlikely that you might experience AWS issues.

All Issues experienced by the `Gravitee` Devops Team with `AWS` are referenced [in this page](./documentation/aws-common-issues/README.md), to help you with the issues your team might experience as well.

If you were granted Gravitee Devops Support, Also Team will keep you informed of the status of every issue, on the Slack channel dedicated for your team.

## ANNEX : More about Fargate


You will find some knowledge about Fargate, in [this page](./documentation/fargate)



## ANNEX : Expose Gravitee To the world (Setting up your `AWS ALB` for your `Fargate` Cluster)



You will find detailed explanation on how to setup your `AWS ALB`, to expose `Gravitee Gateway` [in this page](./documentation/aws-alb)





## ANNEX : Pulumi Troubleshooting `CTRL + C` `pulumi up`

Terraforming may be quite long, and sometimes, for exeample if you realize you set a
wrong config value, you just want to stop and re launch it with modified config parameter value.

This how you can do that :

* `CTRL + C` twice (pulumi warns you first time)
* Then `pulumi cancel` command will actually cancel all running pulumi request to Cloud Provider :
```bash
$ pulumi stack export -s gio_fargate | pulumi stack import -s gio_fargate
warning: removing pending operation 'creating' on 'urn:pulumi:gio_fargate::prod-postnloperator::prod-postnloperator:GraviteeKube$kubernetes:helm.sh/v2:Chart$kubernetes:core/v1:Pod::gravitee-apim-elasticsearch-test' from snapshot
error: could not import deployment: [409] another update is currently in progress or was interrupted. Try again later.) Try again later
    for more information about this error, see https://pulumi.io/oa5g1o
$ pulumi cancel
This will irreversibly cancel the currently running update for 'gio_fargate'!
Please confirm that this is what you'd like to do by typing ("gio_fargate"): gio_fargate
The currently running update for 'gio_fargate' has been canceled!
$ pulumi stack export -s gio_fargate | pulumi stack import -s gio_fargate
warning: removing pending operation 'creating' on 'urn:pulumi:gio_fargate::prod-postnloperator::prod-postnloperator:GraviteeKube$kubernetes:helm.sh/v2:Chart$kubernetes:core/v1:Pod::gravitee-apim-elasticsearch-test' from snapshot
Import successful.
$ pulumi refresh
Previewing refresh (gio_fargate):
     Type                                    Name                                                                                      Plan
     pulumi:pulumi:Stack                     prod-postnloperator-gio_fargate                                                            running..
     ├─ prod-postnloperator:GraviteeKube     gravitee-api-gateway-gio_fargate
     │  ├─ kubernetes:helm.sh:Chart          gravitee-am
```

* And after that, run this to recover consistent state (pulumi has state management, just like `terraform`, see [`terragrunt`](https://github.com/gruntwork-io/terragrunt) ):

```bash
export PULUMI_STACK_NAME='gio_fargate'
export PULUMI_STACK_NAME='staging'

pulumi stack export -s "${PULUMI_STACK_NAME}" | pulumi stack import -s "${PULUMI_STACK_NAME}"
pulumi cancel
pulumi stack export -s "${PULUMI_STACK_NAME}" | pulumi stack import -s "${PULUMI_STACK_NAME}"
pulumi refresh --yes

pulumi destroy --yes && pulumi destroy --yes -s "${PULUMI_STACK_NAME}" && pulumi up --yes -s "${PULUMI_STACK_NAME}"

```

* `Pulumi` allows configuring custom timeouts : https://www.pulumi.com/docs/intro/concepts/programming-model/#customtimeouts

## ANNEX AWS IAM user management

A few tips and explanatiosn on how AWS IAM / Kubernetes RBAC integration works, for you to manage your Team's  AWS users in [this page](./documentation/aws-team-mgmt)

## ANNEX : `Fargate`, private and public subnets

https://thenewstack.io/how-aws-fargate-turned-amazon-eks-into-serverless-container-platform/

<h2>A Look at the Fargate Profile</h2>
<p>The key link between Kubernetes and Fargate is the Fargate profile which can be either created during the provisioning of the cluster (through the <em>eksctl</em> CLI) or added at a later point.</p>
<p>The Fargate profile contains the essential elements that associate Kubernetes with the Fargate control plane. The profile contains the below elements:</p>
<ul>
<li><strong>Pod Execution Role: </strong>Since the pod eventually turns into an EC2 micro VM, we need to pass the role that the instance can assume to make calls to services such as ECR. Without this role, the Fargate agent/kubelet cannot talk to the AWS universe.</li>
<li><strong>Subnets: </strong>Even though the Fargate data plane runs in a hidden, private VPC, a subnet from the customer VPC is needed to route the inbound and outbound traffic. At this time, pods running on Fargate are not assigned public IP addresses, so only private subnets are allowed.</li>
<li><strong>Selectors: </strong>An entire namespace or a set of labels within Kubernetes may be associated with the Fargate control plane. Any pod that targets the designated namespace or a pod with the labels is a hint to EKS to turn that into a Fargate deployment.</li>
</ul>
