import { SQSEvent } from "aws-lambda";
import { v4 } from "uuid";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { getDynamoDBClient } from "../../shared/utils";
import { ProductsTableName, StocksTableName } from "../../shared/constant";

const client = getDynamoDBClient();
const snsClient = new SNSClient({});
const topicArn = process.env.CREATE_PRODUCT_TOPIC_ARN;

export async function catalogBatchProcess(event: SQSEvent): Promise<void> {
  console.log("🚀 ~ Received SQS event:", JSON.stringify(event));

  for (const record of event.Records) {
    try {
      const product = JSON.parse(record.body);
      const id = v4();
      // PUT Product
      const productCommand = new PutItemCommand({
        TableName: ProductsTableName,
        Item: {
          id: { S: id },
          title: { S: product.title ?? product.Title },
          description: { S: product.description ?? product.Description },
          price: { N: (product.price ?? product.Price).toString() },
        },
      });
      // PUT Stock count
      await client.send(productCommand);
      const stockCommand = new PutItemCommand({
        TableName: StocksTableName,
        Item: {
          product_id: { S: id },
          count: { N: (product.count ?? product.Count)?.toString() ?? 1 },
        },
      });
      await client.send(stockCommand);
      console.log("🚀 ~ Product and stock added successfully:", id);
      // Publish to SNS
      await snsClient.send(
        new PublishCommand({
          TopicArn: topicArn,
          Subject: "New Product Created",
          Message: JSON.stringify({ id, ...product }),
        })
      );
    } catch (error) {
      console.log("🚀 ~ catalogBatchProcess ~ error:", record.body, error);
    }
  }
}
