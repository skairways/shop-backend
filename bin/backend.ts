#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ProductsLabdaStack } from "../lib/productsLambdaStack";
import { ImportServiceStack } from "../lib/ImportServiceStack";

const app = new cdk.App();
const productServiceStack = new ProductsLabdaStack(
  app,
  "MyProductsLabdaStack",
  {}
);
const importServiceStack = new ImportServiceStack(app, "ImportServiceStack", {
  catalogQueue: productServiceStack.catalogItemsQueue,
});
