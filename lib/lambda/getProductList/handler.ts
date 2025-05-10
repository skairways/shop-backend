import { ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  getDynamoDBClient,
  normalizeProductData,
  normalizeStockData,
} from "../../shared/utils";
import { SERVER_ERROR } from "../../shared/constant";
import { ProductDTO, StockDTO } from "../../shared/types";
import { mergeData } from "./utils";
import { ProductsTableName, StocksTableName } from "../../seed";

const client = getDynamoDBClient();

export async function getProductList() {
  try {
    const [products, stocks] = await Promise.all([
      client.send(new ScanCommand({ TableName: ProductsTableName })),
      client.send(new ScanCommand({ TableName: StocksTableName })),
    ]);
    const productsData = (products?.Items?.map(normalizeProductData) ??
      []) as ProductDTO[];

    const stocksData = (stocks?.Items?.map(normalizeStockData) ??
      []) as StockDTO[];

    return mergeData(productsData, stocksData);
  } catch (error) {
    console.log("🚀 ~ getProductsList ~ error:", error);
    return new Error(SERVER_ERROR);
  }
}
