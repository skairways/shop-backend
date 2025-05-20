import { S3 } from "aws-sdk";
import { S3Event } from "aws-lambda";
import { SERVER_ERROR } from "../../shared/constant";
const csvParser = require("csv-parser");

export async function importFileParser(event: S3Event) {
  console.log("🚀 ~ main ~ request:", event);
  const s3 = new S3();
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = record.s3.object.key;

      console.log(`Processing file: ${key} from bucket: ${bucket}`);

      const s3Stream = s3
        .getObject({ Bucket: bucket, Key: key })
        .createReadStream();

      await new Promise<void>(() => {
        s3Stream
          .pipe(csvParser())
          .on("data", (data: Record<string, string>) => {
            console.log("Parsed Record:", data);
          })
          .on("end", () => {
            console.log(`Finished processing file: ${key}`);
          })
          .on("error", (error: Error) => {
            console.log(`Error reading file:`, error);
          });
      });
    }
    return;
  } catch (error) {
    console.log("🚀 ~ importFileParser ~ error:", error);
    return new Error(SERVER_ERROR);
  }
}
