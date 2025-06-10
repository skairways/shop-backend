import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LAMBDA_FOLDER_PATH } from "./shared/constant";

export class AuthorizerServiceStack extends cdk.Stack {
  public readonly basicAuthorizerLambda: lambda.Function;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const handler = "basicAuthorizer";

    this.basicAuthorizerLambda = new NodejsFunction(this, "lambda-function", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      entry: path.join(__dirname, LAMBDA_FOLDER_PATH, handler, "handler.ts"),
      handler,
    });

    this.basicAuthorizerLambda.addPermission("ApiGatewayInvokePermission", {
      principal: new cdk.aws_iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:*/*/*/*`,
    });

    new cdk.CfnOutput(this, "BasicAuthorizerLambdaArn", {
      value: this.basicAuthorizerLambda.functionArn,
      exportName: "BasicAuthorizerLambdaArn",
    });
  }
}
