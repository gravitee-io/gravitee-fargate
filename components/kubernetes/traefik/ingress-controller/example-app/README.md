# The Saint Nectaire demo REST API


* add to your `/etc/hosts` :

```bash
# Saint Nectaire PostNL

127.0.0.1 saint-nectaire.mycompany.io mycompany.io
```

* Then, with a `kubectl port-forward` , we can hit traefik, and be routed back to the Saint Nectaire example API :

```bash

# kubectl port-forward svc/traefik 8888:8000 # in another shell session

jbl@poste-devops-jbl-16gbram:~/gio$ ping -c 4 saint-nectaire.mycompany.io
PING saint-nectaire.mycompany.io (127.0.0.1) 56(84) bytes of data.
64 bytes from localhost (127.0.0.1): icmp_seq=1 ttl=64 time=0.048 ms
64 bytes from localhost (127.0.0.1): icmp_seq=2 ttl=64 time=0.050 ms
64 bytes from localhost (127.0.0.1): icmp_seq=3 ttl=64 time=0.048 ms
64 bytes from localhost (127.0.0.1): icmp_seq=4 ttl=64 time=0.049 ms

--- saint-nectaire.mycompany.io ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3054ms
rtt min/avg/max/mdev = 0.048/0.048/0.050/0.008 ms
jbl@poste-devops-jbl-16gbram:~/gio$ curl -iv http://saint-nectaire.mycompany.io:8888/notls
*   Trying 127.0.0.1:8888...
* TCP_NODELAY set
* Connected to saint-nectaire.mycompany.io (127.0.0.1) port 8888 (#0)
> GET /notls HTTP/1.1
> Host: saint-nectaire.mycompany.io:8888
> User-Agent: curl/7.68.0
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
HTTP/1.1 200 OK
< Content-Length: 446
Content-Length: 446
< Content-Type: text/plain; charset=utf-8
Content-Type: text/plain; charset=utf-8
< Date: Fri, 21 Aug 2020 11:01:23 GMT
Date: Fri, 21 Aug 2020 11:01:23 GMT

<
Hostname: whoami-bd6b677dc-tcrrh
IP: 127.0.0.1
IP: ::1
IP: 10.0.172.11
IP: fe80::a0c8:5bff:fe76:853
RemoteAddr: 10.0.158.202:33890
GET /notls HTTP/1.1
Host: saint-nectaire.mycompany.io:8888
User-Agent: curl/7.68.0
Accept: */*
Accept-Encoding: gzip
X-Forwarded-For: 127.0.0.1
X-Forwarded-Host: saint-nectaire.mycompany.io:8888
X-Forwarded-Port: 8888
X-Forwarded-Proto: http
X-Forwarded-Server: traefik-74dfb956c5-dpl9h
X-Real-Ip: 127.0.0.1

* Connection #0 to host saint-nectaire.mycompany.io left intact


```
