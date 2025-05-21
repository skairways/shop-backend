import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import { LAMBDA_FOLDER_PATH, SERVER_ERROR } from "./shared/constant";

interface ImportServiceStackProps extends cdk.StackProps {
  catalogQueue: cdk.aws_sqs.Queue;
}
export class ImportServiceStack extends cdk.Stack {
  api: apigateway.RestApi;
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "ImportServiceBucket", {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
    });

    const importProductsFileLambda = this.createLambda(
      "import-products-file-lambda",
      "importProductsFile"
    );

    bucket.grantReadWrite(importProductsFileLambda);
    importProductsFileLambda.addEnvironment(
      "IMPORT_BUCKET_NAME",
      bucket.bucketName
    );

    const importFileParserLambda = this.createLambda(
      "import-file-parser-lambda",
      "importFileParser",
      props
    );

    bucket.grantReadWrite(importFileParserLambda);
    props.catalogQueue.grantSendMessages(importFileParserLambda);
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
        requestTemplates: {
          "application/json": JSON.stringify({
            name: "$input.params('name')",
          }),
        },
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

  private createLambda(
    lambdaName: string,
    handler: string,
    props?: ImportServiceStackProps
  ) {
    return new NodejsFunction(this, lambdaName, {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler,
      entry: path.join(__dirname, LAMBDA_FOLDER_PATH, handler, "handler.ts"),
      environment: {
        SQS_QUEUE_URL: props?.catalogQueue.queueUrl as string,
      },
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
