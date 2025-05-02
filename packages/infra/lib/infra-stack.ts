import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from 'constructs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // s3 bucket
    const webSiteBucket = new s3.Bucket(this, 'Bucket', {
      websiteErrorDocument: 'index.html',
      websiteIndexDocument: 'index.html',
    })
    
    // OAI
    const webSiteIdentify = new cloudfront.OriginAccessIdentity(this, 'WebSiteIdentify', {comment: 'WebSiteIdentify'})
    
    // bucket policy
    const webSiteBucketPolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: iam.Effect.ALLOW,
      principals: [
        webSiteIdentify.grantPrincipal
      ],
      resources: [`${webSiteBucket.bucketArn}/*`]
    })
    
    // add policy
    webSiteBucket.addToResourcePolicy(webSiteBucketPolicy);
    
    // lambda@edge
    const edgeFunction = new cloudfront.experimental.EdgeFunction(this, 'EdgeFunction', {
      code: lambda.Code.fromAsset('../dynamic-ogp-lambda-function'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_22_X
    })
    
    // distribution
    const webSiteDistribution = new cloudfront.Distribution(this, 'WebSiteDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(webSiteBucket),
        edgeLambdas: [
          {
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            functionVersion: edgeFunction.currentVersion,
          }
        ],
      },
      errorResponses: [
        {
          httpStatus:403,
          responseHttpStatus:200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0)
          
        },
        {
          httpStatus:404,
          responseHttpStatus:200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0)
        }
      ]
    })
    
    // s3 deploy
    new s3Deployment.BucketDeployment(this, 'S3Deployment', {
      sources: [s3Deployment.Source.asset('../frontend/dist/frontend/browser')],
      destinationBucket: webSiteBucket,
      distribution: webSiteDistribution,
    })
  }
}
