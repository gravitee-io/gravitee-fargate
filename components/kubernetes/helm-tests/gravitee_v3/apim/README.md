# Gravtiee AM v3.x : Helm deployment, with external `MongoDB` and `Elasticsearch`

* I test deploying gravitee using helm charts.
* When ready, I will convert to pulumi source code in `Gravitee.ts`.

## `Helm`

```bash
#
helm repo add graviteeio https://helm.gravitee.io


# --- MONGO_URI for A [DocumentDb] ...
export MY_AWS_ACCESS_KEY_ID='xfgjhcfhcfgh'
export MY_AWS_SECRET_ACCESS_KEY='wdfgR/dsfgzer634T3ZfsdftCF3635DFVSDY7UHD'
export MY_AWS_SESSION_TOKEN='65546546fgh654fgh6546dfg654df6g4df6g4df6g4df6g54d6g4dg'
export MONGO_APPLICATION_CONN_STRING="mongo 'mongodb+srv://${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}@cluster0.example.com/testdb?authSource=$external&authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN:${AWS_SESSION_TOKEN}'"
export MONGO_URI="mongodb+srv://${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}@cluster0.example.com/testdb?authSource=$external&authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN:${AWS_SESSION_TOKEN}'"

# --- MONGO_URI for a simple no auth / no https MongoDB instance (quick alternative to [DocumentDb])
export MONGO_HOST='54.228.103.148'
export MONGO_DB_NAME='gravitee'
# mongo --host "${MONGO_HOST}:27017"

export MONGO_URI="${MONGO_HOST}:27017"
export MONGO_URI="mongodb://${MONGO_HOST}:27017/gravitee?serverSelectionTimeoutMS=5000&connectTimeoutMS=30000&socketTimeoutMS=30000"
export MONGO_URI="mongodb://${MONGO_HOST}:27017/gravitee?connectTimeoutMS=30000" # From the APIM 3.x Helm chart [values.yaml]



# `elasticsearch.enabled` to `false`, to prevent Helm Chart from provisioning an Elasticsearch in the Fargate Cluster.
# set `es.enabled` to `false`
# and `es.endpoints` to `http://54.228.103.148:9200/` :
# set `mongodb-replicaset.enabled` to `false` to disable provisioning of `MongoDB` `Replicaset`
# set `mongo.uri` to `mongodb://${MONGO_HOST}:27017/gravitee?serverSelectionTimeoutMS=5000&connectTimeoutMS=5000&socketTimeoutMS=5000` to configure external MongoDB access.
# set `rsEnabled` to `false`, because this POC 's Externaml MongoDB is not a replicaset
#

export ES_ENDPOINT1="http://54.228.103.148:9200"

echo "MONGO_URI=[${MONGO_URI}]"
echo "ES_ENDPOINT1=[${ES_ENDPOINT1}]"

# first test : with [], ES_ENDPOINT is set to default 'localhost:9200', and [apim-manageemnt-api] fails to connect to ES. All 3 other 'Gravitee APIM' components are properly running
export SET_CHART_VALUES_STRING="es.endpoints=[${ES_ENDPOINT1}],es.enabled=false,elasticsearch.enabled=false,mongodb-replicaset.enabled=false,rsEnabled=false,mongo.uri=${MONGO_URI},mongo.dbhost=${MONGO_HOST}"
# second test, without brackets [], same result thant with them
export SET_CHART_VALUES_STRING="es.endpoints=${ES_ENDPOINT1},es.enabled=false,elasticsearch.enabled=false,mongodb-replicaset.enabled=false,rsEnabled=false,mongo.uri=${MONGO_URI},mongo.dbhost=${MONGO_HOST}"
# third test, with 'es.enabled=true', same result than two previous tests
export SET_CHART_VALUES_STRING="es.endpoints=${ES_ENDPOINT1},es.enabled=true,elasticsearch.enabled=false,mongodb-replicaset.enabled=false,rsEnabled=false,mongo.uri=${MONGO_URI},mongo.dbhost=${MONGO_HOST}"
# forth test, with syntax for arrays in the --set Helm GNU option : SUCCESS !
export SET_CHART_VALUES_STRING="es.endpoints[0]=${ES_ENDPOINT1},es.enabled=true,elasticsearch.enabled=false,mongodb-replicaset.enabled=false,rsEnabled=false,mongo.uri=${MONGO_URI},mongo.dbhost=${MONGO_HOST}"
# Okay, now adding one more thig : I want to configure WebUI to hit the APIM API using http://127.0.0.1:8383
# --- From the Helm Chart @ https://github.com/gravitee-io/helm-charts/blob/b285688e2eb379770de254690147b428fffb742c/apim/3.x/templates/portal/portal-configmap.yaml#L20
# What happens is that the 'constants.json' is used by the WebUI to determine what is the API URL
# and this parameter is set by [.Values.ui.baseURL]
#
# ---
# So :
#
export SET_CHART_VALUES_STRING="es.endpoints[0]=${ES_ENDPOINT1},es.enabled=true,elasticsearch.enabled=false,mongodb-replicaset.enabled=false,rsEnabled=false,mongo.uri=${MONGO_URI},mongo.dbhost=${MONGO_HOST}"
export GRAVITEE_MGMT_UI_API_BASE_URL="http://apim.example.com:8383/management/organizations/DEFAULT/environments/DEFAULT/"
export GRAVITEE_PORTAL_API_BASE_URL="http://apim-portal.example.com:8383/portal/environments/DEFAULT"
export SET_CHART_VALUES_STRING="${SET_CHART_VALUES_STRING},portal.baseURL=${GRAVITEE_PORTAL_API_BASE_URL},ui.baseURL=${GRAVITEE_MGMT_UI_API_BASE_URL}"
export SET_CHART_VALUES_STRING="${SET_CHART_VALUES_STRING},gateway.logging.file.enabled=false,api.logging.file.enabled=false"
export SET_CHART_VALUES_STRING="${SET_CHART_VALUES_STRING},smtp.enabled=false"

export GRAVITEEIO_VERSION=3.1.0
export GRAVITEEIO_VERSION=3.1.1

export SET_CHART_VALUES_STRING="${SET_CHART_VALUES_STRING},api.image.tag=${GRAVITEEIO_VERSION},portal.image.tag=${GRAVITEEIO_VERSION},ui.image.tag=${GRAVITEEIO_VERSION},gateway.image.tag=${GRAVITEEIO_VERSION}"

echo "SET_CHART_VALUES_STRING=[${SET_CHART_VALUES_STRING}]"

# helm get manifest
export AWS_PROFILE=gio_poc
helm install --dry-run graviteeio-apim3xx graviteeio/apim3 --set "${SET_CHART_VALUES_STRING}"
# helm install graviteeio-apim3xx graviteeio/apim3 --set "${SET_CHART_VALUES_STRING}"

# helm delete graviteeio-apim3x

# ---
# On Fargate, we must label the services to have them sheduled by the [Fargate Scheduler].
#
export FARGATE_PROFILE_NAME='giofargateprofile'
export FARGATE_POSTNL_LABEL="eks.amazonaws.com/fargate-profile=${FARGATE_PROFILE_NAME}"


# --- GRAVIEE APIM '3.x' components
# service/graviteeio-apim3x-api
# service/graviteeio-apim3x-gateway
# service/graviteeio-apim3x-portal
# service/graviteeio-apim3x-ui
# ---

kubectl label svc graviteeio-apim3x-api "${FARGATE_POSTNL_LABEL}" --overwrite
kubectl label svc graviteeio-apim3x-gateway "${FARGATE_POSTNL_LABEL}" --overwrite
kubectl label svc graviteeio-apim3x-portal "${FARGATE_POSTNL_LABEL}" --overwrite
kubectl label svc graviteeio-apim3x-ui "${FARGATE_POSTNL_LABEL}" --overwrite


kubectl label svc whoami "${FARGATE_POSTNL_LABEL}" --overwrite

```

* After that, `PostNL` Team can experience the following scenario :
  * I give PostNL Team an `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` : an IAM user that I created, and I gave this user **permissions to assume** the IAM Role, and the IAM Role gives persmissions to `kubectl-port-forward`, according :
    * https://github.com/kubernetes-sigs/aws-iam-authenticator/issues/174#issuecomment-651031781
    * https://aws.amazon.com/premiumsupport/knowledge-center/eks-iam-permissions-namespaces/
  * slack to send them GPG encrypted `~/.aws/credentials` file
  * I tell the team to execute the `update-kubeconfig`
  * edit your `/etc/hosts`, and add :

```bash
# PostNL setup

127.0.0.1 apim.example.com
127.0.0.1 apim-portal.example.com
127.0.0.1 apim-gw.example.com
```

  * in 3 different shell sessions run the `kubectl port-forward` for `apim-management-ui`, `apim-portal-ui`, `apim-gateway`,
  * tell them to connect to :
    * http://apim.example.com:8112/ : username `admin` / pwd `admin`  :
      * `kubectl port-forward service/graviteeio-apim3x-ui '8112:8002'`
    * http://apim-portal.example.com:8113/ : username `admin` / pwd `admin`
      * `kubectl port-forward service/graviteeio-apim3x-portal '8113:8003'`
    * http://apim-gw.example.com:8113/ :
      * `kubectl port-forward service/graviteeio-apim3x-portal '8282:82'`













#### Digging


* port forward of all 4 APIM `3.x` services (the webui double trick) :

  * `kubectl port-forward service/graviteeio-apim3x-ui '8112:8002'`  will locally expose WebUI.
  * But the problem is that the WebUI tries to connect to APIM using `https://apim.example.com/management/organizations/DEFAULT/environments/DEFAULT/portal`
  * So I will :
    * Helm redeploy `APIM 3.x`, with new configuration so that `gravteeio/apim-management-ui` (WebUI) reaches the APIM API on http://127.0.0.1:8383 (non http) :
    * `kubectl port-forward` the `APIM 3.x API`, on local port `8383`
    * we can locally `curl` the `APIM 3.x API`, like this (this is the first APIM request made by the `graviteeio/apim-management-ui` Web UI):

```bash
jbl@poste-devops-jbl-16gbram:~/hilare$ curl -iv -u "admin:admin" http://127.0.0.1:8383/management/organizations/DEFAULT/environments/DEFAULT/portal
*   Trying 127.0.0.1:8383...
* TCP_NODELAY set
* Connected to 127.0.0.1 (127.0.0.1) port 8383 (#0)
* Server auth using Basic with user 'admin'
> GET /management/organizations/DEFAULT/environments/DEFAULT/portal HTTP/1.1
> Host: 127.0.0.1:8383
> Authorization: Basic YWRtaW46YWRtaW4=
> User-Agent: curl/7.68.0
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
HTTP/1.1 200 OK
< Vary: Origin
Vary: Origin
< Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Method
< Vary: Access-Control-Request-Headers
Vary: Access-Control-Request-Headers
< Content-Type: application/json
Content-Type: application/json
< X-Content-Type-Options: nosniff
X-Content-Type-Options: nosniff
< X-XSS-Protection: 1; mode=block
X-XSS-Protection: 1; mode=block
< Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
< Pragma: no-cache
Pragma: no-cache
< Expires: 0
Expires: 0
< X-Frame-Options: DENY
X-Frame-Options: DENY
< Content-Length: 2835
Content-Length: 2835

<
{
  "company" : {
    "name" : "Gravitee.io"
  },
  "management" : {
    "title" : "Gravitee.io Management",
    "url" : ""
  },
  "portal" : {
    "title" : "Gravitee.io Portal",
    "entrypoint" : "https://api.company.com",
    "apikeyHeader" : "X-Gravitee-Api-Key",
    "support" : {
      "enabled" : true
    },
    "userCreation" : {
      "enabled" : true
    },
    "url" : "",
    "apis" : {
      "tilesMode" : {
        "enabled" : true
      },
      "categoryMode" : {
        "enabled" : true
      },
      "apiHeaderShowTags" : {
        "enabled" : true
      },
      "apiHeaderShowCategories" : {
        "enabled" : true
      }
    },
    "analytics" : {
      "enabled" : false
    },
    "rating" : {
      "enabled" : true,
      "comment" : {
        "mandatory" : false
      }
    },
    "uploadMedia" : {
      "enabled" : false,
      "maxSizeInOctet" : 1000000
    }
  },
  "authentication" : {
    "forceLogin" : {
      "enabled" : false
    },
    "localLogin" : {
      "enabled" : true
    },
    "google" : { },
    "github" : { },
    "oauth2" : {
      "color" : "#0076b4",
      "scope" : [ ]
    }
  },
  "scheduler" : {
    "tasks" : 10,
    "notifications" : 10
  },
  "documentation" : {
    "url" : "https://docs.gravitee.io"
  },
  "theme" : {
    "name" : "default",
    "logo" : "themes/assets/GRAVITEE_LOGO1-01.png",
    "loader" : "assets/gravitee_logo_anim.gif"
  },
  "plan" : {
    "security" : {
      "apikey" : {
        "enabled" : true
      },
      "oauth2" : {
        "enabled" : true
      },
      "keyless" : {
        "enabled" : true
      },
      "jwt" : {
        "enabled" : true
      }
    }
  },
  "apiQualityMetrics" : {
    "enabled" : false,
    "functionalDocumentationWeight" : 0,
    "technicalDocumentationWeight" : 0,
    "descriptionWeight" : 0,
    "descriptionMinLength" : 100,
    "logoWeight" : 0,
    "categoriesWeight" : 0,
    "labelsWeight" : 0,
    "healthcheckWeight" : 0
  },
  "apiReview" : {
    "enabled" : false
  },
  "logging" : {
    "maxDurationMillis" : 0,
    "audit" : {
      "enabled" : false,
      "trail" : {
        "enabled" : false
      }
    },
    "user" : {
      "displayed" : false
    }
  },
  "analytics" : {
    "clientTimeout" : 30000
  },
  "application" : {
    "registration" : {
      "enabled" : false
    },
    "types" : {
      "simple" : {
        "enabled" : true
      },
      "browser" : {
        "enabled" : true
      },
      "web" : {
        "enabled" : true
      },
      "native" : {
        "enabled" : true
      },
      "backend_to_backend" : {
        "enabled" : true
      }
    }
  },
  "alert" : {
    "enabled" : false
  },
  "maintenance" : {
    "enabled" : false
  },
  "newsletter" : {
    "enabled" : true
  },
  "reCaptcha" : {
    "enabled" : false,
    "siteKey" : ""
  }
* Connection #0 to host 127.0.0.1 left intact
}
jbl@poste-devops-jbl-16gbram:~/hilare$
```



### `MongoDB`

* Env. var. related to configuring external `MongoDB` :
  * set `mongodb-replicaset.enabled` to `false` to disable provisioning of `MongoDB` `Replicaset`
  * set `mongo.uri` to set connections informations to external `MongoDB`
  * [form](https://docs.mongodb.com/manual/reference/connection-string/#connections-connection-examples) of the `mongo.uri` is :

    * **If using an `AWS`** session token, as well, provide it with the `AWS_SESSION_TOKEN` `authMechanismProperties` value, as follows :
```bash
export AWS_ACCESS_KEY_ID='xfgjhcfhcfgh'
export AWS_SECRET_ACCESS_KEY='wdfgR/dsfgzer634T3ZfsdftCF3635DFVSDY7UHD'
export AWS_SESSION_TOKEN='65546546fgh654fgh6546dfg654df6g4df6g4df6g4df6g54d6g4dg'
# ---
export MONGO_URI="mongo 'mongodb+srv://${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}@cluster0.example.com/testdb?authSource=$external&authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN:${AWS_SESSION_TOKEN}'"
```
    * ohter known cases :
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

### `Elasticsearch`

* To disable provisioning of `Elasticsearch` by the helm Chart, set `elasticsearch.enabled` to `false` :
* Then, to tell `Gravitee APIM` how to connect to the exterrnal `Elasticsearch`, set `es.endpoints` (an Array in which all entries are connection URLs to the Amazon `Elasticsearch` Service )
