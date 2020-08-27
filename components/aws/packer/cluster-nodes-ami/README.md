# The Gio Cluster OS image : PXEless boot of the cluster

This boilerplate would help you create your own `AWS` `AMI` image, to PXEless boot you rEKS Cluster Nodes.

You might want cluster nodes to run pods in your cluster, but not on `Fargate`.


### Buildnd the AWS AMI for EKS cluster nodes

* In your envirpnement, you need :
  * `pulumi`
  * `aws-cli`
  * `packer`
  * the `AWS` credentials for the tenant you work for, on the lcal filesystem at `~/.aws/credentials`

* Execute :

```bash
# ---
./components/aws/packer/cluster-nodes-ami/packer-quick-install.sh
./components/aws/packer/cluster-nodes-ami/build-ami.sh


# quick devops cycle :
# git pull && packer build ./components/aws/packer/cluster-nodes-ami/template.json

```

# Base AMI

* J'ai tout d'abord construit l'AMI constituant la base image de worker nodes du cluster, sur la base du standard `Amazon Linux version 2`.
* J'ai ensuite trouvé ceci ; https://docs.aws.amazon.com/eks/latest/userguide/eks-optimized-ami.html
* Je vais donc changer d'image de base et relancer le build `Packer`, en utilisant comme image de base (cf. `SOURCE_IAMGE`, dans le template `Packer`)


# AMI History

TODO : faire un tableau :
* en colonnes, les cluster kubernetes,
* et 4 colonnes suppélmentaires : `date` / author / support contact / description
* une release d'AMI par ligne, dans l'
* first published AMI : `eu-west-1` / `ami-0f68d8914afc68574`
* second published AMI : `ami-0f50e42c76b6fa038` (avec la correction pour la taille de VM `t2.small => t2.medium` )

# `Packer` : additional disks

* Pour ajouter du volume disque dès la création de l'`AMI`, on a deux références :
  * https://grahamc.com/blog/packer-ami-device-volume-types
  * https://www.packer.io/docs/builders/amazon-ebs.html#block-devices-configuration
  * https://www.packer.io/docs/builders/amazon-ebs.html#ami-block-device-mappings-example
  * et le `components/aws/packer/cluster-nodes-ami/template-with-additional-disks.json` que j'ai écirt et testé : il ajoute bien du volume disque
* Ok, donc quand j'ai fini de créer mon `AMI`, avec `Packer`, j'ai à la fin :
  * un nouvel AMI, (`aws ec2 deregister-image --image-id ami-0f68d8914afc68574`)
  * un snapshot de cet AMI a automatiquement été fait, et peut être retrouvé à partir de l'`AMI_ID`,
comme le montre le script que j'ai écris `components/aws/packer/cluster-nodes-ami/utils/wipe-out-image.sh`
* et d'autre part, l'[exemple `pulumi` officiel suivant](https://github.com/pulumi/pulumi-aws/blob/27270568c2c7050af8c157f5ecd7add0b8442378/sdk/nodejs/ec2/ami.ts#L30) montre que l'on peut alors, à partir de ce snapshot, créer un nouvel AMI , auquel on peut ajouter des disques :

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
// Create an AMI that will start a machine whose root device is backed by
// an EBS volume populated from a snapshot. It is assumed that such a snapshot
// already exists with the id "snap-xxxxxxxx".
const example = new aws.ec2.Ami("example", {
    ebsBlockDevices: [{
        deviceName: "/dev/xvda",
        snapshotId: "snap-xxxxxxxx",
        volumeSize: 8,
    }],
    rootDeviceName: "/dev/xvda",
    virtualizationType: "hvm",
});
```
* La référence au `snapshotId`, dans le code exemple ci-dessus, correspond au snaphot Id retrouvé à partir de l'AMI ID, comme ci-dessous :

```bash
jbl@poste-devops-jbl-16gbram:~/proto.gio.prod_ANOTHER_BRICK$ export AMI_ID=ami-0949e551fcb2b23ce
jbl@poste-devops-jbl-16gbram:~/proto.gio.prod_ANOTHER_BRICK$ aws ec2 describe-snapshots --owner-ids self | jq --arg AMI_ID "${AMI_ID}" '.Snapshots[]| select(.Description | contains($AMI_ID))' | jq .SnapshotId | awk -F '"' '{print $2}'
snap-0e7954526e51bb716
jbl@poste-devops-jbl-16gbram:~/proto.gio.prod_ANOTHER_BRICK$ aws ec2 describe-snapshots | jq --arg AMI_ID "${AMI_ID}" '.Snapshots[]| select(.Description | contains($AMI_ID))' | jq .SnapshotId | awk -F '"' '{print $2}'
snap-0e7954526e51bb716
```
* On remarquera que les deux premières commandes dont on voit la sortie standard ci-dessus, donnent le même résultat :
  * Celle utilsant l'option `--owner-ids self`  s'exécute beaucoup plus rapdidement, parcequ'elle restreint la recherche, aux snapshots qui sont propriété du `AWS IAM User` courant.
  * Donc, dans une démarche incrémentale, dans un pipeline, on aura toujorus la pratique suivante :
    * L'opérateur en action, crééra toujours un premir AMI, à partir d'un `SOURCE AMI`
    * Puis il retrouvera radpidement avec `--owner-ids self`, le snapshot de cet `AMI`, pusiqu'il lui appartient. Et crééra l'AMI suivant, ayant ajouté le disques souahités.

* Je cite la doc officielle AWS :

>
> During the `AMI`-creation process, Amazon `EC2` creates snapshots of your instance's `root` volume and any other `EBS` volumes attached to your instance. **You're charged** for the snapshots **until you deregister the `AMI` and delete the snapshots**.
>
> _Source_ : https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/creating-an-ami-ebs.html
>

* D'autre part, il sera très important pour nous de reprendre en compte, pour l'efficacité de notre Infra As Code, la remarque suivante d'AW sur al gestion des volumes :

>
> Depending on the size of the volumes, it can take several minutes for the `AMI`-creation process to complete (sometimes up to `24` hours). You may find it **more efficient to create snapshots of your volumes before creating your `AMI`**. This way, only **small, incremental snapshots** need to be **created when the `AMI` is created**, and the process completes more quickly (the **total time for snapshot creation remains the same**). For more information, see Creating Amazon EBS snapshots.
>
> _Source_ : https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/creating-an-ami-ebs.html
>

* En effet, à chaque fois que l'on créée une image `AMI`, un snapshot est créé. C'est cette création que l'on recommende de gérer incrémentalement. Cf. L'exemple avec le cLuster gio pour l'API gio.
* Par exemple, si l'on veut faire une VM avec 7 disques durs, il sera recommandé de fabriquer 7 AMI, un nouveau pour chque nouveau disque :
  * le premier est crééé à partir d'un "`SOURCE AMI`"
  * les `6` autres sont créés à partir du snapshot des `EBS` volume du précedent


### Références

* https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/creating-an-ami-ebs.html
* https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ComponentsAMIs.html#storage-for-the-root-device
* https://www.packer.io/docs/builders/amazon-ebs.html
