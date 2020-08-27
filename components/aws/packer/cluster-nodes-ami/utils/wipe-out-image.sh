#!/bin/bash

set -e

aws ec2 describe-images --owners self
aws ec2 describe-snapshots --owner-ids self

export AMI_ID=$1

if [ "x${AMI_ID}" == "x" ]; then
  echo " You must provide as first argument of [$0], the AMI ID of the AWS image you want to wipe out"
  exit 1
fi;

aws ec2 deregister-image --image-id ${AMI_ID}

echo ''

aws ec2 describe-snapshots --owner-ids self | jq .

echo ''

aws ec2 describe-snapshots --owner-ids self | jq --arg AMI_ID "${AMI_ID}" '.Snapshots[]| select(.Description | contains($AMI_ID))'

echo ''

# ---
# the EBS Volume we de-registered, had a snapshot associated to it.
# We want to delete it as well
export ASSOCIATED_SNAPSHOT_ID=$(aws ec2 describe-snapshots --owner-ids self | jq --arg AMI_ID "${AMI_ID}" '.Snapshots[]| select(.Description | contains($AMI_ID))' | jq .SnapshotId | awk -F '"' '{print $2}')


aws ec2 delete-snapshot --snapshot-id ${ASSOCIATED_SNAPSHOT_ID}

echo "S'il reste un snsashot associé à [${AMI_ID}], il sera listé ci-dessous : "
aws ec2 describe-snapshots --owner-ids self | jq --arg AMI_ID "ami-0f68d8914afc68574" '.Snapshots[]| select(.Description | contains($AMI_ID))'
