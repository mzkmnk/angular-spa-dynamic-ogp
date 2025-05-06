import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from 'constructs';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'node:path';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // s3 bucket
    const webSiteBucket = new s3.Bucket(this, 'Bucket', {
      websiteErrorDocument: 'index.html',
      websiteIndexDocument: 'index.html',
    })
    
    // ogp bucket
    const ogpBucket = new s3.Bucket(this, 'ogpBucket');
    
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
    
    // add lambda@edge permission policy
    const edgeRole = new iam.Role(this, 'EdgeRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('edgelambda.amazonaws.com'),
        new iam.ServicePrincipal('lambda.amazonaws.com'),
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
    })
    
    // edgeRole.addToPrincipalPolicy(new iam.PolicyStatement({
    //   actions: ['s3:ListBucket'],
    //   effect: iam.Effect.ALLOW,
    //   resources: [webSiteBucket.bucketArn,ogpBucket.bucketArn]
    // }))
    //
    // edgeRole.addToPrincipalPolicy(new iam.PolicyStatement({
    //   actions: ['s3:GetObject'],
    //   effect: iam.Effect.ALLOW,
    //   resources: [`${webSiteBucket.bucketArn}/*`,`${ogpBucket.bucketArn}/*`]
    // }))
    
    webSiteBucket.grantRead(edgeRole);
    ogpBucket.grantRead(edgeRole);
    
    const ogpFn = new NodejsFunction(this, 'OgpFn', {
      entry: path.join(__dirname, '../../dynamic-ogp-lambda-function/src/index.ts'),
      runtime: lambda.Runtime.NODEJS_22_X,
      bundling: {
        format: OutputFormat.ESM,
        loader: {'.wasm':'file','.ttf':'file'},
        mainFields: ['module', 'main'],
      },
      role: edgeRole,
    })
    
    // distribution
    const webSiteDistribution = new cloudfront.Distribution(this, 'WebSiteDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(webSiteBucket),
        edgeLambdas: [
          {
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            functionVersion: ogpFn.currentVersion,
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
    
    // web bucket s3 deploy
    new s3Deployment.BucketDeployment(this, 'S3Deployment', {
      sources: [s3Deployment.Source.asset('../frontend/dist/frontend/browser')],
      destinationBucket: webSiteBucket,
      distribution: webSiteDistribution,
    })
    
    // ogp bucket s3 deploy
    new s3Deployment.BucketDeployment(this, 'OgpS3Deployment', {
      sources: [s3Deployment.Source.asset('../create-ogp/ogps')],
      destinationBucket: ogpBucket
    })
  }
}
