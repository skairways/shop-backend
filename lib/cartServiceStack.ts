import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class CartServiceStack extends cdk.Stack {
  api: apigateway.RestApi;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nestAppLambda = new NodejsFunction(this, "NestAppHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: "../../nodejs-aws-cart-api",
    });

    this.api = new apigateway.RestApi(this, "NestApi", {
      restApiName: "Nest Service",
      description: "This service serves a Nest.js application.",
    });

    const getLambdaIntegration = new apigateway.LambdaIntegration(
      nestAppLambda
    );

    // Output API URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
    });
  }
}
