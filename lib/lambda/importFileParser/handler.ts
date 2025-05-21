import { S3 } from "aws-sdk";
import { S3Event } from "aws-lambda";
import { SERVER_ERROR } from "../../shared/constant";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
const csvParser = require("csv-parser");

const sqs = new SQSClient({});
const s3 = new S3();

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL as string;

export async function importFileParser(event: S3Event) {
  console.log("🚀 ~ main ~ request:", event);
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = record.s3.object.key;

      console.log(`Processing file: ${key} from bucket: ${bucket}`);

      const s3Stream = s3
        .getObject({ Bucket: bucket, Key: key })
        .createReadStream();

      const sendMessagePromises: Promise<any>[] = [];

      return await new Promise<void>((resolve, reject) => {
        s3Stream
          .pipe(csvParser())
          .on("data", async (data: Record<string, string>) => {
            const command = new SendMessageCommand({
              QueueUrl: SQS_QUEUE_URL,
              MessageBody: JSON.stringify(data),
            });

            const sendPromise = sqs
              .send(command)
              .then((res) => console.log("✅ SQS Message Sent:", res.MessageId))
              .catch((error) =>
                console.error("🚨 Error sending to SQS:", error)
              );
            sendMessagePromises.push(sendPromise);
          })
          .on("end", async () => {
            try {
              await Promise.all(sendMessagePromises);
              console.log(`Finished processing file: ${key}`);
              resolve();
            } catch (err) {
              console.error("❌ Error waiting for all SQS messages:", err);
              reject(err);
            }
          })
          .on("error", (error: Error) => {
            console.log(`Error reading file:`, error);
            reject(error);
          });
      });
    }
  } catch (error) {
    console.error("🚀 ~ importFileParser ~ error:", error);
    return new Error(SERVER_ERROR);
  }
}
