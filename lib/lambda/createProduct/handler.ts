import { Handler } from "aws-lambda";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 } from "uuid";
import { ProductsTableName, StocksTableName } from "../../seed";
import { Product } from "../../shared/types";
import { getDynamoDBClient } from "../../shared/utils";

const client = getDynamoDBClient();

export const createProduct: Handler = async (payload: Product) => {
  const productId = v4();
  console.log("🚀 ~ createProduct:Handler= ~ payload:", payload);

  try {
    const productCommand = new PutItemCommand({
      TableName: ProductsTableName,
      Item: {
        id: { S: productId },
        title: { S: payload.title },
        description: { S: payload.description },
        price: { N: payload.price.toString() },
      },
    });

    await client.send(productCommand);
    const stockCommand = new PutItemCommand({
      TableName: StocksTableName,
      Item: {
        product_id: { S: productId },
        count: { S: payload.count.toString() ?? 1 },
      },
    });
    await client.send(stockCommand);

    return { productId };
  } catch (error) {
    console.log("Error: ", error);
    throw new Error("Error adding item to Product table");
  }
};
