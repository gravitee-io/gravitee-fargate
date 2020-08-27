import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const managedPolicyArns: string[] = [
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
    "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
];

// Creates a role and attches the EKS worker node IAM managed policies
export function createRole(name: string): aws.iam.Role {
    const role = new aws.iam.Role(name, {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            Service: "ec2.amazonaws.com",
        }),
    });

    let counter = 0;
    for (const policy of managedPolicyArns) {
        // Create RolePolicyAttachment without returning it.
        const rpa = new aws.iam.RolePolicyAttachment(`${name}-policy-${counter++}`,
            { policyArn: policy, role: role },
        );
    }

    return role;
}

export function createPodsRole(name: string): aws.iam.Role {

  const role = new aws.iam.Role(name, {
      assumeRolePolicy: JSON.stringify({
          Version: "2020-08-20",
          Statement: [{
              Action: "sts:AssumeRole",
              Principal: {
                  Service: "ec2.amazonaws.com"
              },
              Effect: "Allow",
              Sid: ""
          }]
      })
  });

  const rolePolicy = new aws.iam.RolePolicy( name + "-rolepolicy", {
      role: role,
      policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [{
              Action: [ "ec2:Describe*" ],
              Effect: "Allow",
              Resource: "*"
          }]
      })
  });

  const policy = new aws.iam.Policy( name + "-policy", {
      policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [{
              Action: [
                "ec2:Describe*"
              ],
              Effect: "Allow",
              Resource: "*"
          }]
      })
  });

  const rolePolicyAttachment = new aws.iam.RolePolicyAttachment( name + "-rolepolicyattachment", {
      role: role,
      policyArn: policy.arn
  });
  return role;

}





/**

const user = new aws.iam.User("myuser");

const group = new aws.iam.Group("mygroup");

const policyAttachment = new aws.iam.PolicyAttachment("mypolicyattachment", {
    users: [user],
    groups: [group],
    roles: [role],
    policyArn: policy.arn
});
**/
