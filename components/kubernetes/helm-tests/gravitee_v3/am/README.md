# Gravtiee APIM v3.x : Helm deployment

* I test deploying gravitee using helm charts.
* When ready, I will convert to pulumi source code in `Gravitee.ts`.

## Helm

```bash
#
helm repo add graviteeio https://helm.gravitee.io

helm install --name graviteeio-am graviteeio/am


# set `mongodb-replicaset.enabled` to `false` to disable provisioning of `MongoDB` `Replicaset`
# set `mongo.uri` to set connections informations to external `MongoDB`
export MONGO_URI="mongodb://example1.com,example2.com,example3.com/?replicaSet=test&readPreference=secondary"


```


### MongoDB

* Env. var. related to configuring external `MongoDB` :
  * set `mongodb-replicaset.enabled` to `false` to disable provisioning of `MongoDB` `Replicaset`
  * set `mongo.uri` to set connections informations to external `MongoDB`
  * [form](https://docs.mongodb.com/manual/reference/connection-string/#connections-connection-examples) of the `mongo.uri` is :

    * **If using an `AWS`** session token, as well, provide it with the `AWS_SESSION_TOKEN` `authMechanismProperties` value, as follows :
```bash
export AWS_ACCESS_KEY_ID='<aws access key id>'
export AWS_SECRET_ACCESS_KEY='<aws secret access key>'
export AWS_SESSION_TOKEN='<aws session token>'
# ---
export MONGO_URI="mongo 'mongodb+srv://${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}@cluster0.example.com/testdb?authSource=$external&authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN:${AWS_SESSION_TOKEN}'"
```

    * other known cases :

```bash
export MONGO_URI="mongodb://example1.com,example2.com,example3.com/?replicaSet=test&readPreference=secondary"

# ReplicaSet with READ DISTRIBUTION
export MONGO_URI="mongodb://example1.com,example2.com,example3.com/?replicaSet=test&readPreference=secondary"

# Replica Set with a High Level of Write Concern
export MONGO_URI="mongodb://example1.com,example2.com,example3.com/?replicaSet=test&w=majority&wtimeoutMS=2000"

# Sharded Cluster
export MONGO_URI="mongodb://router1.example.com:27017,router2.example2.com:27017,router3.example3.com:27017/"

# MongoDB Atlas Cluster
export MONGO_URI="mongo 'mongodb+srv://<aws access key id>:<aws secret access key>@cluster0.example.com/testdb?authSource=\$external&authMechanism=MONGODB-AWS'"


```
