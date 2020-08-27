#!/bin/bash

set -e


# ---
# Trouver l'image de base "EKS optimized" :
#
# ---
# aws ec2 describe-images --owners self  --filters "Name=root-device-type,Values=ebs" --filters "Name=name,Values=${POSTNL_AMI_NAME}"
# aws ssm get-parameters-by-path --path /aws/service/eks/optimized-ami/1.16/amazon-linux-2/recommended --query Parameters[].Value  --region eu-west-1

# export AMAZON_LINUX_2_LATEST=$(aws ssm get-parameters --names /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 --region eu-west-1 | jq .Parameters[0].Value | awk -F '"' '{print $2}')

echo ''
echo '----------------------------------------------------------------------------------------------------------------------------------------------------------------'
echo ' Base Image will be : '
echo '----------------------------------------------------------------------------------------------------------------------------------------------------------------'
aws ssm get-parameters-by-path --path /aws/service/eks/optimized-ami/1.16/amazon-linux-2/recommended --query Parameters[]  --region eu-west-1| jq
echo '----------------------------------------------------------------------------------------------------------------------------------------------------------------'
echo ''

# export AMAZON_EKS_OPTIMIZED_LINUX_LATEST=$(aws ssm get-parameters --names /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 --region eu-west-1 | jq .Parameters[0].Value | awk -F '"' '{print $2}')
export AMAZON_EKS_OPTIMIZED_LINUX_LATEST=$(aws ssm get-parameters-by-path --path /aws/service/eks/optimized-ami/1.16/amazon-linux-2/recommended --query Parameters[]  --region eu-west-1| jq '.[]  | select(.Name == "/aws/service/eks/optimized-ami/1.16/amazon-linux-2/recommended/image_id")'|jq .Value|awk -F '"' '{print $2}')
echo "AMAZON_EKS_OPTIMIZED_LINUX_LATEST=[${AMAZON_EKS_OPTIMIZED_LINUX_LATEST}]"
export SOURCE_AMI=${AMAZON_EKS_OPTIMIZED_LINUX_LATEST}
export AWS_REGION=eu-west-1
# --
# see also https://github.com/y13i/ec2-image-amazonlinux/blob/359fe0c4c9540df01ac3dd2645b6aa960ae119dc/packer.json
# --


echo '' | tee -a  ./components/aws/packer/cluster-nodes-ami/gio-seed.txt
echo '# Publishing' | tee -a ./components/aws/packer/cluster-nodes-ami/gio-seed.txt
echo '' | tee -a ./components/aws/packer/cluster-nodes-ami/gio-seed.txt
echo " gio Amazon AWS AMI build at $(date)" | tee -a ./components/aws/packer/cluster-nodes-ami/gio-seed.txt
echo '' | tee -a ./components/aws/packer/cluster-nodes-ami/gio-seed.txt



packer build ./components/aws/packer/cluster-nodes-ami/template.json | tee sortie.packer

export GIO_AMI_ID=$(cat sortie.packer|grep 'ami-' | tail -n 1 | awk -F ': ' '{print $2}')

# aws ec2 describe-images --owners self


export GIO_AMI_NAME=$(cat sortie.packer|grep 'Prevalidating AMI Name:'| awk -F ': ' '{print $3}')


echo ""
echo " Here is the AMI Id of the OS image for you K8S Cluster Nodes : "
echo ""
echo "   POSTNL_AMI_ID=[${GIO_AMI_ID}]"
echo ""
echo ""
echo ""


# aws ec2 describe-images --executable-users self
