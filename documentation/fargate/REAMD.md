# How to deploy an app to Fargate






## List fargate profiles with AWS CLI v2


* List and inspect fargate profiles for your cluster :

```bash
export AWS_PROFILE=gio_poc
export AWS_REGION=eu-west-1

export CLUSTER_NAME=$(aws eks list-clusters --region=eu-west-1 | jq '.clusters[0]' | awk -F '"' '{print $2}')

aws eks list-fargate-profiles --cluster ${CLUSTER_NAME}


export FARGATE_PROFILE_NAME=$(aws eks list-fargate-profiles --cluster ${CLUSTER_NAME} | jq '.fargateProfileNames[0]' | awk -F '"' '{print $2}')

aws eks describe-fargate-profile --cluster ${CLUSTER_NAME} --fargate-profile-name ${FARGATE_PROFILE_NAME}

```

* Example output :

```bash
jbl@poste-devops-jbl-16gbram:~$ aws eks list-fargate-profiles --cluster gioEKSCluster-eksCluster-25277a9
{
    "fargateProfileNames": [
        "giofargateprofile-277fc2e",
        "giofargateprofile-3402384"
    ]
}
jbl@poste-devops-jbl-16gbram:~$ aws eks describe-fargate-profile --cluster gioEKSCluster-eksCluster-25277a9 --fargate-profile-name giofargateprofile-3402384
{
    "fargateProfile": {
        "fargateProfileName": "giofargateprofile-3402384",
        "fargateProfileArn": "arn:aws:eks:eu-west-1:788910987246:fargateprofile/gioEKSCluster-eksCluster-25277a9/giofargateprofile-3402384/96ba17a8-4e77-400c-4e96-8dbc9c18e4bc",
        "clusterName": "gioEKSCluster-eksCluster-25277a9",
        "createdAt": "2020-08-27T11:47:27.699000+02:00",
        "podExecutionRoleArn": "arn:aws:iam::788910987246:role/podsAWSRole-ae4d30b",
        "subnets": [
            "subnet-03eac2550d06f23ec",
            "subnet-05cdadc41781b5e63",
            "subnet-065c5f5a5bde4fab1",
            "subnet-065c03ef526603078"
        ],
        "selectors": [
            {
                "namespace": "default",
                "labels": {
                    "graviteefargate": "serverless"
                }
            }
        ],
        "status": "ACTIVE",
        "tags": {}
    }
}

```


## The Fargate Scheduler and pod selectors


* Label the pods you want to run on fargate :

```bash
export AWS_PROFILE=gio_poc
export AWS_REGION=eu-west-1

# Labelling with fargate profile name

kubectl label svc graviteeio-stack-apim3-api eks.amazonaws.com/fargate-profile=giofargateprofile --overwrite
kubectl label svc graviteeio-stack-apim3-gateway eks.amazonaws.com/fargate-profile=giofargateprofile --overwrite
kubectl label svc graviteeio-stack-apim3-ui eks.amazonaws.com/fargate-profile=giofargateprofile --overwrite
kubectl label svc graviteeio-stack-apim3-portal eks.amazonaws.com/fargate-profile=giofargateprofile --overwrite

# Labelling with Fargate profile pod selector

kubectl label svc graviteeio-stack-apim3-api eks.amazonaws.com/fargate-profile=giofargateprofile --overwrite
kubectl label svc graviteeio-stack-apim3-gateway eks.amazonaws.com/fargate-profile=giofargateprofile --overwrite
kubectl label svc graviteeio-stack-apim3-ui eks.amazonaws.com/fargate-profile=giofargateprofile --overwrite
kubectl label svc graviteeio-stack-apim3-portal eks.amazonaws.com/fargate-profile=giofargateprofile --overwrite


# Test Labelling with fargate profile name

kubectl label svc graviteeio-stack-apim3-api eks.amazonaws.com/fargate-profile=giofargateprofile-3402384 --overwrite
kubectl label svc graviteeio-stack-apim3-gateway eks.amazonaws.com/fargate-profile=giofargateprofile-3402384 --overwrite
kubectl label svc graviteeio-stack-apim3-ui eks.amazonaws.com/fargate-profile=giofargateprofile-3402384 --overwrite
kubectl label svc graviteeio-stack-apim3-portal eks.amazonaws.com/fargate-profile=giofargateprofile-3402384 --overwrite

kubectl label svc graviteeio-stack-apim3-api graviteefargate=serverless --overwrite
kubectl label svc graviteeio-stack-apim3-gateway graviteefargate=serverless --overwrite
kubectl label svc graviteeio-stack-apim3-ui graviteefargate=serverless --overwrite
kubectl label svc graviteeio-stack-apim3-portal graviteefargate=serverless --overwrite

```
