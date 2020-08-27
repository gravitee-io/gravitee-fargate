# Test it

```bash
jbl@poste-devops-jbl-16gbram:~/gio_poc$ docker push quay.io/gravitee-lab/mongo-curl:0.0.1
The push refers to repository [quay.io/gravitee-lab/mongo-curl]
5127ee1e20dd: Preparing
a0080c465792: Preparing
52db7d53ad5e: Preparing
7af85e8f3327: Preparing
d0f104dc0a1f: Preparing
unauthorized: access to the requested resource is not authorized
jbl@poste-devops-jbl-16gbram:~/gio_poc$ docker login -u="$QUAY_BOT_USERNAME" -p="$QUAY_BOT_SECRET" quay.io
WARNING! Using --password via the CLI is insecure. Use --password-stdin.
Error response from daemon: Get https://quay.io/v2/: unauthorized: Invalid Username or Password
jbl@poste-devops-jbl-16gbram:~/gio_poc$ export QUAY_BOT_USERNAME=gravitee-lab+graviteebot
jbl@poste-devops-jbl-16gbram:~/gio_poc$ export QUAY_BOT_SECRET=
jbl@poste-devops-jbl-16gbram:~/gio_poc$ export QUAY_BOT_SECRET=6RGGLP8GJIYVJB9PL7DC42BOT697506GDRODIBI771JA51T15F9CLEBO5PUC5CJ2
jbl@poste-devops-jbl-16gbram:~/gio_poc$ docker login -u="$QUAY_BOT_USERNAME" -p="$QUAY_BOT_SECRET" quay.io
WARNING! Using --password via the CLI is insecure. Use --password-stdin.
WARNING! Your password will be stored unencrypted in /home/jbl/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store

Login Succeeded
jbl@poste-devops-jbl-16gbram:~/gio_poc$ docker push quay.io/gravitee-lab/mongo-curl:0.0.1
The push refers to repository [quay.io/gravitee-lab/mongo-curl]
5127ee1e20dd: Pushing [==================================================>]  297.3MB
a0080c465792: Pushed
52db7d53ad5e: Pushed
7af85e8f3327: Pushed
d0f104dc0a1f: Pushed


```


# Troubleshoting connection issues

https://docs.aws.amazon.com/documentdb/latest/developerguide/troubleshooting.connecting.html
