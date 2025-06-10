#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ProductsLabdaStack } from "../lib/productsLambdaStack";
import { ImportServiceStack } from "../lib/ImportServiceStack";
import { AuthorizerServiceStack } from "../lib/authorizationServiceStack";

const app = new cdk.App();
const productServiceStack = new ProductsLabdaStack(
  app,
  "MyProductsLabdaStack",
  {}
);

const authorzierServiceStack = new AuthorizerServiceStack(
  app,
  "AuthorizerServiceStack",
  {}
);

const authorizerLambdaArn = cdk.Fn.importValue("BasicAuthorizerLambdaArn");

const importServiceStack = new ImportServiceStack(app, "ImportServiceStack", {
  catalogQueue: productServiceStack.catalogItemsQueue,
  authorizerLambdaArn,
});
