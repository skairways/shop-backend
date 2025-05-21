import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { ProductsTableName, StocksTableName } from "./shared/constant";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import {
  LAMBDA_FOLDER_PATH,
  PRODUCT_ID_KEY,
  SERVER_ERROR,
} from "./shared/constant";

export class ProductsLabdaStack extends cdk.Stack {
  productsTable: dynamodb.ITable;
  stocksTable: dynamodb.ITable;
  api: apigateway.RestApi;
  catalogItemsQueue: cdk.aws_sqs.Queue;
  createProductTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables import setup
    this.productsTable = dynamodb.Table.fromTableName(
      this,
      "imported-products-table",
      ProductsTableName
    );

    this.stocksTable = dynamodb.Table.fromTableName(
      this,
      "imported-stocks-table",
      StocksTableName
    );

    this.catalogItemsQueue = new sqs.Queue(this, "catalog-items-queue", {
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    this.createProductTopic = new sns.Topic(this, "create-product-topic", {
      displayName: "Product creation notification topic",
    });

    // Lambdas
    const getProudctsListlambda = this.createLambda(
      "get-list-lambda",
      "getProductList"
    );

    const getProductByIdLambda = this.createLambda(
      "get-by-id-lambda",
      "getProductById"
    );

    const createProductLambda = this.createLambda(
      "create-product-lambda",
      "createProduct"
    );

    const catalogBatchProcessLambda = this.createLambda(
      "catalog-batch-process-lambda",
      "catalogBatchProcess"
    );

    // SQS
    catalogBatchProcessLambda.addEventSource(
      new SqsEventSource(this.catalogItemsQueue, {
        batchSize: 5,
      })
    );
    this.productsTable.grantWriteData(catalogBatchProcessLambda);

    //SNS
    this.createProductTopic.addSubscription(
      new subs.EmailSubscription("sultonbek.nazarov1999@gmail.com")
    );
    this.createProductTopic.grantPublish(catalogBatchProcessLambda);

    // API Gateway
    this.api = new apigateway.RestApi(this, "products-api", {
      restApiName: "Products API Gateway",
      description: "This API serves the products lambda functions.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["GET"],
      },
    });

    // Integration for listing products
    const productsLambdaIntegration = new apigateway.LambdaIntegration(
      getProudctsListlambda,
      {
        proxy: false,
        integrationResponses: [
          this.configureIntegrationResponseHTTP200(),
          this.configureIntegrationResponseHTTP500(),
        ],
      }
    );

    // Integration for getting product by ID
    const productByIdIntegration = new apigateway.LambdaIntegration(
      getProductByIdLambda,
      {
        proxy: false,
        requestTemplates: {
          "application/json": JSON.stringify({
            productId: `$input.params('${PRODUCT_ID_KEY}')`,
          }),
        },
        integrationResponses: [
          this.configureIntegrationResponseHTTP200(),
          this.configureIntegrationResponseHTTP500(),
        ],
      }
    );

    // Integration for creating product
    const createProductLambdaIntegration = new apigateway.LambdaIntegration(
      createProductLambda,
      {
        proxy: false,
        requestTemplates: {
          "application/json": "$input.body",
        },
        integrationResponses: [
          this.configureIntegrationResponseHTTP200(),
          this.configureIntegrationResponseHTTP500(),
        ],
      }
    );

    // /products route
    const productsResource = this.api.root.addResource("products");
    productsResource.addMethod("GET", productsLambdaIntegration, {
      methodResponses: [
        this.configureMethodResponseHTTP200(),
        this.configureMethodResponseHTTP500(),
      ],
    });

    // /products/{productId} route
    const productIdResource = productsResource.addResource(
      `{${PRODUCT_ID_KEY}}`
    );
    productIdResource.addMethod("GET", productByIdIntegration, {
      methodResponses: [
        this.configureMethodResponseHTTP200(),
        this.configureMethodResponseHTTP500(),
      ],
    });

    // POST /products route
    productsResource.addMethod("POST", createProductLambdaIntegration, {
      methodResponses: [
        this.configureMethodResponseHTTP200(),
        this.configureMethodResponseHTTP500(),
      ],
    });

    // Output API URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
    });
  }

  private createLambda(lambdaName: string, handler: string) {
    const lambdaFn = new NodejsFunction(this, lambdaName, {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler,
      entry: path.join(__dirname, LAMBDA_FOLDER_PATH, handler, "handler.ts"),
      environment: {
        PRODUCTS_TABLE_NAME: ProductsTableName as string,
        STOCKS_TABLE_NAME: StocksTableName as string,
        SQS_QUEUE_URL: this.catalogItemsQueue.queueUrl,
        CREATE_PRODUCT_TOPIC_ARN: this.createProductTopic.topicArn,
      },
    });

    this.productsTable.grantReadWriteData(lambdaFn);
    this.stocksTable.grantReadWriteData(lambdaFn);

    return lambdaFn;
  }

  private configureIntegrationResponseHTTP200(): apigateway.IntegrationResponse {
    return {
      statusCode: "200",
      responseTemplates: { "application/json": "$input.json('$')" },
      responseParameters: this.configureIntegrationResponseParameters(),
    };
  }

  private configureIntegrationResponseHTTP500(): apigateway.IntegrationResponse {
    return {
      statusCode: "500",
      selectionPattern: `.*${SERVER_ERROR}*.`,
      responseTemplates: {
        "application/json": JSON.stringify({
          message: "Server error",
        }),
      },
      responseParameters: this.configureIntegrationResponseParameters(),
    };
  }

  private configureMethodResponseHTTP200(): apigateway.MethodResponse {
    return {
      statusCode: "200",
      responseParameters: this.configureMethodResponseParameters(),
    };
  }

  private configureMethodResponseHTTP500(): apigateway.MethodResponse {
    return {
      statusCode: "500",
      responseParameters: this.configureMethodResponseParameters(),
    };
  }

  private configureIntegrationResponseParameters(): apigateway.IntegrationResponse["responseParameters"] {
    return {
      "method.response.header.Access-Control-Allow-Origin": "'*'",
      "method.response.header.Content-Type": "'application/json'",
    };
  }

  private configureMethodResponseParameters(): apigateway.MethodResponse["responseParameters"] {
    return {
      "method.response.header.Access-Control-Allow-Origin": true,
      "method.response.header.Content-Type": true,
    };
  }
}
