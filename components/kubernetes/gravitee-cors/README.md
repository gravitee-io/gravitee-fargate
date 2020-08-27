# Gravitee Web UIs and CORS


ok, la question de servir en accès public les 3 services de Gravtiee AM , c'est réglé avec la base e IngressRoutes Kubernetes CRD déifnis par `Traefik` cf. https://gitlab.com/bureau1/prototypes/migration-non-fargate/-/tags/API_UP_INGRESS_OUT

* Voilà comment taper directement dans le cotneneur `nginx` servant le contenu statique de la `Gravitee AM Web UI` (qui sert le contenur statique du client, et qui définit donc les règles restrictives `CORS`) :

```bash
:~$ kubectl exec -it service/gravitee-am-management-ui bash
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl kubectl exec [POD] -- [COMMAND] instead.
bash-5.0# ls -allh
total 8K
drwxr-xr-x    1 root     root          39 May 19 00:59 .
drwxr-xr-x    1 root     root          39 May 19 00:59 ..
-rwxr-xr-x    1 root     root           0 May 19 00:59 .dockerenv
drwxr-xr-x    1 root     root          19 Feb 18 21:46 bin
drwxr-xr-x    5 root     root         360 May 19 00:59 dev
drwxr-xr-x    1 root     root          19 May 19 00:59 etc
drwxr-xr-x    2 root     root           6 Jan 23 14:36 home
drwxr-xr-x    1 root     root          17 Jan 23 14:36 lib
drwxr-xr-x    5 root     root          44 Jan 23 14:36 media
drwxr-xr-x    2 root     root           6 Jan 23 14:36 mnt
drwxr-xr-x    2 root     root           6 Jan 23 14:36 opt
dr-xr-xr-x  172 root     root           0 May 19 00:59 proc
drwx------    1 root     root          24 Feb 18 21:46 root
drwxrwxr-x    1 root     root          38 May 19 00:59 run
-rw-r--r--    1 root     root         741 Jul 10  2019 run.sh
drwxr-xr-x    2 root     root        4.0K Jan 23 14:36 sbin
drwxr-xr-x    2 root     root           6 Jan 23 14:36 srv
dr-xr-xr-x   13 root     root           0 May 19 00:59 sys
drwxrwxrwt    1 root     root           6 Feb 18 21:46 tmp
drwxr-xr-x    1 root     root          28 Jan 23 14:36 usr
drwxr-xr-x    1 root     root          30 Feb 18 21:46 var
bash-5.0# cat run
cat: read error: Is a directory
bash-5.0# cat run.sh
#!/bin/sh
#
# Copyright (C) 2015 The Gravitee team (http://gravitee.io)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# generate configs
/bin/confd -onetime -backend env

# start nginx foreground
exec /usr/sbin/nginx -g 'daemon off;'
bash-5.0# cat etc/nginx/nginx.conf

user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
}
bash-5.0# cat etc/nginx/conf.d/default.conf
server {
    listen 80;
    listen 443;
    server_name _;

    index index.html index.htm;
    charset utf-8;

    location / {
        try_files $uri$args $uri$args/ $uri $uri/ /index.html =404;
        root /var/www/html;
    }

    # redirect server error pages to the static page /50x.html
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}bash-5.0#
```
* une fois la recette valdiée je l'automatise avec une configmap à ajouter au déploiement Gravitee, pour surcharger la définition  de `/nginx/conf.d/default.conf`, dans le conteneur, avec donc une ConfigMap et un volume monté dans le conteneur :

```
# overriding /nginx/conf.d/default.conf , adding
# Nginx configuration that enables CORS, with support for
# preflight requests. Credits to https://michielkalkman.com/snippets/nginx-cors-open-configuration/
# This should be used for the [NGINX] container in [Gravitee Pod], serving static content for [Gravitee AM Web UI]
server {
    listen 80;
    listen 443;
    server_name _;

    index index.html index.htm;
    charset utf-8;
    # rewrite ^/(.*)/$ /$1 permanent;
    rewrite /(.*)/$ /$1 permanent;

    location / {
        try_files $uri$args $uri$args/ $uri $uri/ /index.html =404;
        proxy_redirect off;
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        root /var/www/html;

         if ($request_method = 'POST') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
         }
         if ($request_method = 'GET') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
         }
         if ($request_method = 'PUT') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
         }
         if ($request_method = 'DELETE') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
         }
    }


    # redirect server error pages to the static page /50x.html
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}

```

* Comment faire une conf CORS avec NGINX, morceaux choisis (mais autorise moi tout, s'il te plaît) :
  * à la main, j'édite le fichier `/etc/nginx/conf.d/default.conf` dans le conteneur du pod de la `Web UI Gravitee AM`
  * puis recharger à cahud la conf nginx en exécutant la commande `nginx -s reload`
  * c'est un nginx Alpine tout ce qu'il y a de plus classique.

* lorsque j'exécute ce test à la main, avec comme conf, la configuration présentée ci-dessus, dans le fichier `/retc/nginx/conf.d/default.conf` :
  * j'ai bien une dispartition des erreurs "CORS blocking HTTP request"
  * mais il reeste une erreur, non pas de cORS, mais relaticve aux CORS : le certificat SSL pour cahcque nom de domaine appelé, doit être un certificat :
    * "trusted" au moins pour mon browser `Firefox` :cemaon pourrait le régler avec une exécution de commande sur la machine surlaquelle tourne le browser.
    * ok il y a 2 noms de domaines utilisés, ma conf nginx règle bien le problème des CORS : après il suffit que le Firefox considère comme "trusted" les certifcats de tous les noms de domaines accédès en CORS par la `Gravitee AM Web UI`



* je peux le redémarrer en mode rollout (depuis Kubernetes `1.15`, avant même le breaking change `1.16` bien connu ) :

```bash
kubectl rollout restart deployment gravitee-am-management-ui
```
* mais alors le problème est que mon fichier de conf disparaît (y a t-il un voulme mount, emabrquant la nginx.conf, dans le `Helm Chart Gravitee` ? fort possible)
