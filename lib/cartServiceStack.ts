import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { BundlingFileAccess } from "aws-cdk-lib";

export class CartServiceStack extends cdk.Stack {
  api: apigateway.RestApi;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nestAppLambda = new lambda.Function(this, "NestLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "dist/src/serverless-main.handler",
      code: lambda.Code.fromAsset("dist.zip"),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        DATABASE_HOST:
          "rds-cloud-x-database.cetywe2eqcal.us-east-1.rds.amazonaws.com",
        DATABASE_PORT: "5432",
        DATABASE_USERNAME: "postgres",
        DATABASE_PASSWORD: "postgres",
        DATABASE_NAME: "postgres",
      },
    });

    this.api = new apigateway.LambdaRestApi(this, "NestApi", {
      handler: nestAppLambda,
      proxy: false,
    });

    this.api.root.addMethod("ANY");

    const proxyResource = this.api.root.addResource("{proxy+}");
    proxyResource.addMethod("ANY");

    // Output API URL
    new cdk.CfnOutput(this, "Nest app ApiUrl", {
      value: this.api.url,
    });
  }
}
