import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import {
  ImportServiceBucket,
  LAMBDA_FOLDER_PATH,
  SERVER_ERROR,
} from "./shared/constant";

export class ImportServiceStack extends cdk.Stack {
  api: apigateway.RestApi;
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "MyImportServiceBucket", {
      versioned: true,
      bucketName: ImportServiceBucket,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const importProductsFileLambda = this.createLambda(
      "import-products-file-lambda",
      "importProductsFile"
    );

    const importFileParserLambda = this.createLambda(
      "import-file-parser-lambda",
      "importFileParser"
    );

    bucket.grantReadWrite(importFileParserLambda);
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: "uploaded/" }
    );

    // API Gateway
    this.api = new apigateway.RestApi(this, "import-service-api", {
      restApiName: "Import Service API",
      description: "This API serves the import service.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["POST"],
      },
    });

    const importProductsFileIntegration = new apigateway.LambdaIntegration(
      importProductsFileLambda,
      {
        proxy: false,
        integrationResponses: [
          this.configureIntegrationResponseHTTP200(),
          this.configureIntegrationResponseHTTP500(),
        ],
      }
    );

    const importProductsFileResource = this.api.root.addResource("import");
    importProductsFileResource.addMethod("GET", importProductsFileIntegration, {
      methodResponses: [
        this.configureMethodResponseHTTP200(),
        this.configureMethodResponseHTTP500(),
      ],
    });
  }

  private createLambda(lambdaName: string, handler: string) {
    return new NodejsFunction(this, lambdaName, {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler,
      entry: path.join(__dirname, LAMBDA_FOLDER_PATH, handler, "handler.ts"),
    });
  }

  private configureIntegrationResponseHTTP200() {
    return {
      statusCode: "200",
      responseTemplates: {
        "application/json": "$input.json('$')",
      },
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
