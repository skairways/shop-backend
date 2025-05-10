import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import {
  getDynamoDBClient,
  normalizeProductData,
  normalizeStockData,
} from "../../shared/utils";
import { SERVER_ERROR } from "../../shared/constant";
import { mergeData } from "./utils";
import { ProductsTableName, StocksTableName } from "../../seed";

const client = getDynamoDBClient();

export async function getProductById(request: { productId: string }) {
  console.log("🚀 ~ main ~ request:", request);
  const { productId } = request;

  try {
    const commandToProductsTable = new GetItemCommand({
      TableName: ProductsTableName,
      Key: {
        id: { S: productId },
      },
    });

    const commandToStocksTable = new GetItemCommand({
      TableName: StocksTableName,
      Key: {
        product_id: { S: productId },
      },
    });

    const [product, stock] = await Promise.all([
      client.send(commandToProductsTable),
      client.send(commandToStocksTable),
    ]);

    const productItem = normalizeProductData(product.Item);
    const stockItem = normalizeStockData(stock.Item);

    const mergedProduct = mergeData(productItem, stockItem);

    if (!mergedProduct) {
      throw new Error("Not found");
    }

    return mergedProduct;
  } catch (error) {
    console.log("🚀 ~ getProductById ~ error:", error);
    return new Error(SERVER_ERROR);
  }
}
