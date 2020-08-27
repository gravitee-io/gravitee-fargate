FROM  debian:buster-slim

# Install necessary libs
RUN apt-get update && apt-get install -y apt-utils wget gnupg gnupg2 curl

# Install mongodb
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | apt-key add -
RUN echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.2.list
RUN apt-get update -y && apt-get install -y mongodb-org bash

RUN mkdir -p /gravitee
WORKDIR /gravitee
RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem

CMD ["/bin/bash"]
