# Architecture of the POC


## Design

### Networking

* The `Fargate` EKS Cluster where Gravitee lives, The `DocDb` Cluster instance, and The `Amazon Elasticsearch Service` instance must be in same `VPC`.
* The `Fargate` EKS Cluster where Gravitee lives, must be in `2` subnets networks in the `VPC` :
  * one public subnet to allow inbound traffic from the internet
  * one private subnet to allow network connections from the `Fargate` EKS Cluster where Gravitee lives :
    * to The `DocDb` Cluster instance.
    * to The `Amazon Elasticsearch Service` instance.

* The `DocDb` Cluster instance, must be in a private subnet different from the 2 subnets of the `Fargate` EKS Cluster where Gravitee lives.
* The `Amazon Elasticsearch Service` instance, must be in a private subnet different from the 2 subnets of the `Fargate` EKS Cluster where Gravitee lives.
* The `Amazon Elasticsearch Service` instance, and The `DocDb` Cluster instance, must be different private subnets


That way, we can have full control over network traffic between all 3 main components of the infrastructure, using security groups and Egress/Ingress rules
