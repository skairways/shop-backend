import { APIGatewayProxyEvent } from "aws-lambda";
import { getProductById } from "./productService";

export async function main(event: APIGatewayProxyEvent) {
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Product ID is required" }),
    };
  }

  const product = getProductById(productId);

  if (!product) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(product),
  };
}
