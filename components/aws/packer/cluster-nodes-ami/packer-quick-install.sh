#!/bin/bash

# set -e

export TERRAFORM_VERSION=0.12.4
export PACKER_VERSION=1.4.2

mkdir -p bin
mkdir -p .downloads


# Installing packer
if [ ! -f bin/packer ]; then
    wget https://releases.hashicorp.com/packer/${PACKER_VERSION}/packer_${PACKER_VERSION}_linux_amd64.zip -O .downloads/packer_${PACKER_VERSION}_linux_amd64.zip
    unzip .downloads/packer_${PACKER_VERSION}_linux_amd64.zip -d .downloads/packer
    mv .downloads/packer/packer bin/packer
    rm -rf .downloads/packer
fi

rm -rf .downloads

./bin/packer version && mv ./bin/packer /usr/bin
