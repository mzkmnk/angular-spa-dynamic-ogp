import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const webSiteBucket = new s3.Bucket(this, 'Bucket', {
      websiteErrorDocument: 'index.html',
      websiteIndexDocument: 'index.html',
    })
    
    const webSiteIdentify = new cloudfront.OriginAccessIdentity(this, 'WebSiteIdentify', {comment: 'WebSiteIdentify'})
    
    const webSiteBucketPolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: iam.Effect.ALLOW,
      principals: [
        webSiteIdentify.grantPrincipal
      ],
      resources: [`${webSiteBucket.bucketArn}/*`]
    })
    
    webSiteBucket.addToResourcePolicy(webSiteBucketPolicy);
    
    const webSiteDistribution = new cloudfront.Distribution(this, 'WebSiteDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(webSiteBucket)
      },
    })
    
    new s3Deployment.BucketDeployment(this, 'S3Deployment', {
      sources: [s3Deployment.Source.asset('../frontend/dist/frontend/browser')],
      destinationBucket: webSiteBucket,
      distribution: webSiteDistribution,
    })
  }
}
