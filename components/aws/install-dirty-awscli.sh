#!/bin/bash

# https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html

# --
#
# --- #
#  https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html
# --- #
# run as root (or with sudo escalation, then add sudo to execute './aws/install')
# --- #
export AWSCLI_INSTALL_HOME=~/.awscli

mkdir -p ${AWSCLI_INSTALL_HOME}

cd ${AWSCLI_INSTALL_HOME}
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

aws --version
