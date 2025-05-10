import {
  BatchWriteItemCommand,
  DeleteItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 } from "uuid";
import { getDynamoDBClient } from "./shared/utils";
import { Product } from "./shared/types";

const client = getDynamoDBClient();
export const ProductsTableName = "Products";
export const StocksTableName = "Stock";

async function seedProducts() {
  try {
    const command = new BatchWriteItemCommand({
      RequestItems: {
        [ProductsTableName]: PRODUCTS_MOCK.map((product) => ({
          PutRequest: {
            Item: {
              id: { S: product.id },
              title: { S: product.title },
              description: { S: product.description },
              price: { N: product.price.toString() },
            },
          },
        })),
        [StocksTableName]: PRODUCTS_MOCK.map((stock) => ({
          PutRequest: {
            Item: {
              product_id: { S: stock.id },
              count: { S: stock.count.toString() },
            },
          },
        })),
      },
    });
    const response = await client.send(command);
    console.log("Seed:", response);
  } catch (error) {
    console.log("Seed fail:", error);
  }
}

const PRODUCTS_MOCK: Product[] = [
  {
    id: v4(),
    title: "Laptop",
    description: "High-performance laptop",
    price: 1500,
    count: 10,
  },
  {
    id: v4(),
    title: "Headphones",
    description: "Noise-cancelling headphones",
    price: 300,
    count: 20,
  },
  {
    id: v4(),
    title: "Smartphone",
    description: "Latest model smartphone",
    price: 999,
    count: 30,
  },
  {
    id: v4(),
    title: "Tablet",
    description: "Portable and powerful tablet",
    price: 700,
    count: 15,
  },
];

seedProducts();
