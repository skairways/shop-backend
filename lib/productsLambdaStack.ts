import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from "constructs";

export class ProductsLabdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // GET products list lambda
    const getProudctsListlambda = new lambda.Function(this, "get-list-lambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "getProductsList.main",
      code: lambda.Code.fromAsset(path.join(__dirname, "./")),
    });

    // GET product by id lambda
    const getProductByIdLambda = new lambda.Function(this, "get-by-id-lambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "getProductById.main",
      code: lambda.Code.fromAsset(path.join(__dirname, "./")),
    });

    // API Gateway
    const api = new apigateway.RestApi(this, "products-api", {
      restApiName: "My Products API Gateway",
      description: "This API serves the Lambda functions.",
    });

    // Integration for listing products
    const productsLambdaIntegration = new apigateway.LambdaIntegration(
      getProudctsListlambda,
      { proxy: true }
    );

    // Integration for getting product by ID
    const productByIdIntegration = new apigateway.LambdaIntegration(
      getProductByIdLambda,
      { proxy: true }
    );

    // /products route
    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET", productsLambdaIntegration);
    productsResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: apigateway.Cors.ALL_METHODS,
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
    });

    // /products/{productId} route
    const productIdResource = productsResource.addResource("{productId}");
    productIdResource.addMethod("GET", productByIdIntegration);
    productIdResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: apigateway.Cors.ALL_METHODS,
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
    });

    // Output API URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
    });
  }
}
