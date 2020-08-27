/**
 *
 * -------------------------------------------------------------------
 *   Dépendances issues du template de projet @aws-typescript
 * -------------------------------------------------------------------
 *
 **/
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

/**
 *
 * -------------------------------------------------------------------
 *   Code issu du template de projet @aws-typescript
 * -------------------------------------------------------------------
 *
 **/

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("my-bucket");

// Export the name of the bucket
export const bucketName = bucket.id;
