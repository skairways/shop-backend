import { DynamoDBClient, GetItemOutput } from "@aws-sdk/client-dynamodb";
import { ProductDTO, StockDTO } from "./types";

export function getDynamoDBClient() {
  return new DynamoDBClient({
    region: process.env.AWS_REGION,
  });
}

export const normalizeProductData = (
  product: GetItemOutput["Item"]
): ProductDTO | null => {
  if (!product) {
    return null;
  }

  return {
    id: product.id.S as string,
    title: product.title.S as string,
    description: product.description.S as string,
    price: Number(product.price.N),
  };
};

export const normalizeStockData = (
  stock: GetItemOutput["Item"]
): StockDTO | null => {
  if (!stock) {
    return null;
  }

  return {
    product_id: stock.product_id.S as string,
    count: Number(stock.count.S) ?? 0,
  };
};
