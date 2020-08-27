# Provisioning an AWS `DocumentDb` instance

This draft contains elements you may start with, if you want to use an AWS DocumentDB as external Datasource for `Gravitee` running in EKS CLuster on Fargate Scheduled pods.

## Design

### Networking

* `DocDb` must be in same `VPC` than the `Fargate` Cluster where Gravitee lives.
* `Fargate` Cluster must be in a private subnet with security group to be able to set Inbound (Ingress) / Outbound (Egress) networking rules from / to other security groups.
* `DocDb` Cluster must be in a private subnet with security group to be able to set Inbound (Ingress) / Outbound (Egress) networking rules from / to other security groups.

* `DocDb` private network security group must allow network connections on `27017` port from the security group of the subnet network in which `Fargate` Cluster where Gravitee lives.

![archi](./components/aws/documentdb/documentdb-archi.png)


### Connect


* Download the Amazon DocumentDB Certificate Authority (CA) certificate required to authenticate to your cluster
```bash
wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem
```
* Connect to this cluster with the mongo shell


```bash
export QUAY_BOT_USERNAME="gravitee-lab+graviteebot"
export QUAY_BOT_SECRET=gd5dfg5dfg5dfg5dfg5dfg54dfg54df6g5df65

docker login -u="$QUAY_BOT_USERNAME" -p="$QUAY_BOT_SECRET" quay.io

docker build -t gravitee-io-mongo-curl .
docker tag gravitee-io-mongo-curl:latest quay.io/gravitee-lab/mongo-curl:0.0.1
docker login quay.io
docker push quay.io/gravitee-lab/mongo-curl:0.0.1

docker build -t gravitee-io-mongo-curl .
docker tag gravitee-io-mongo-curl:latest quay.io/gravitee-lab/mongo-curl:0.0.2
docker login quay.io
docker push quay.io/gravitee-lab/mongo-curl:0.0.2



# kubectl run curl-jbl --image=quay.io/gravitee-lab/mongo-curl:0.0.1 bash -i --tty --rm
kubectl run curl-jbl --image=quay.io/gravitee-lab/mongo-curl:0.0.2 bash -i --tty --rm


# then inside run :
export MY_PASSWORD='gravitee'
export MY_USERNAME='gravitee'
export MONGO_HOST="gravitee-docdb.cluster-c58w39tlyutx.eu-west-1.docdb.amazonaws.com:27017"

# ---
# connect to documentdb
# can't do that from AWS "isolated network" so have to include it in docker image
wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem
mongo --ssl --host ${MONGO_HOST} --sslCAFile rds-combined-ca-bundle.pem --username ${MY_USERNAME} --password ${MY_PASSWORD}

# ---
# connect to mongodb on my EC2 instance
# can't do that from AWS "isolated network" so have to include it in docker image
export MONGO_HOST='54.228.103.148'
export MONGO_DB_NAME='gravitee'
mongo --host "${MONGO_HOST}:27017" --username ${MY_USERNAME} --password ${MY_PASSWORD}
mongo --host "${MONGO_HOST}:27017"


docker run -itd --name mongo_test  --restart always quay.io/gravitee-lab/mongo-curl:0.0.1 bash
docker exec -it mongo_test bash -c "wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem"
docker exec -it mongo_test bash -c "mongo --ssl --host ${MONGO_HOST} --sslCAFile rds-combined-ca-bundle.pem --username ${MY_USERNAME} --password ${MY_PASSWORD}"


```
* Connect to this cluster with an application :

```bash
export MY_PASSWORD='gravitee'
export MY_USERNAME='gravitee'
export MONGO_URI="mongodb://gravitee:${MY_PASSWORD}@gravitee-docdb.cluster-c58w39tlyutx.eu-west-1.docdb.amazonaws.com:27017/?ssl=true&ssl_ca_certs=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"


```


# Troubleshoting connection issues

https://docs.aws.amazon.com/documentdb/latest/developerguide/troubleshooting.connecting.html

* To verify the port for your Amazon DocumentDB cluster, run the following command :

```bash
~/gio_poc$ aws docdb describe-db-clusters    --db-cluster-identifier gravitee-docdb    --query 'DBClusters[*].[DBClusterIdentifier,Port]'
[
    [
        "gravitee-docdb",
        27017
    ]
]
```
* To get your Amazon DocumentDB security group for your cluster, run the following command.

```bash
~/gio_poc$ aws docdb describe-db-clusters    --db-cluster-identifier gravitee-docdb  --query 'DBClusters[*].[VpcSecurityGroups[*],VpcSecurityGroupId]'
[
    [
        [
            {
                "VpcSecurityGroupId": "sg-03634054db2aea473",
                "Status": "active"
            }
        ],
        null
    ]
]

```
* check dns name :

```bash
~/gio_poc$ aws docdb describe-db-clusters    --db-cluster-identifier gravitee-docdb    --query 'DBClusters[*].Endpoint'
[
    "gravitee-docdb.cluster-c58w39tlyutx.eu-west-1.docdb.amazonaws.com"
]
```
* region n availability zones :

```bash
~/gio_poc$  aws ec2 describe-instances \
>      --query 'Reservations[*].Instances[*].Placement.AvailabilityZone'
[]

```
* https://aws.amazon.com/premiumsupport/knowledge-center/documentdb-cannot-connect/
