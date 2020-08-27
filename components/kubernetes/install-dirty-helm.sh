#!/bin/bash

# --------------------------------------------------------
# run as root or with sudo escalation
# --------------------------------------------------------

export HELM_INSTALL_HOME=~/.helm

# --
# Arm servers
# curl -LO https://get.helm.sh/helm-v3.2.0-linux-arm64.tar.gz

# ---
# Our servers
curl -LO https://get.helm.sh/helm-v3.2.0-linux-amd64.tar.gz

mkdir -p ${HELM_INSTALL_HOME}

tar -xzf helm-v3.2.0-linux-amd64.tar.gz -C ${HELM_INSTALL_HOME}
ls -allh ${HELM_INSTALL_HOME}/linux-amd64/
# --- #
#
# mv ${HELM_INSTALL_HOME}/linux-amd64/helm /usr/local/bin/helm
#

mv ${HELM_INSTALL_HOME}/linux-amd64/helm /usr/bin/helm

export PATH="${PATH}:/usr/bin/helm"

helm version
