import { S3 } from "aws-sdk";
import { SERVER_ERROR } from "../../shared/constant";
const csvParser = require("csv-parser");

export async function importFileParser(request: any) {
  console.log("🚀 ~ main ~ request:", request);
  const s3 = new S3();
  try {
    for (const record of request.Records) {
      const bucket = record.s3.bucket.fileName;
      const key = record.s3.object.key;

      console.log(`Processing file: ${key} from bucket: ${bucket}`);

      const s3Stream = s3
        .getObject({ Bucket: bucket, Key: key })
        .createReadStream();

      s3Stream
        .pipe(csvParser())
        .on("data", (data: any) => {
          console.log("Parsed Record:", data);
        })
        .on("end", () => {
          console.log(`Finished processing file: ${key}`);
        })
        .on("error", (error: any) => {
          console.log(`Error reading file:`, error);
        });
    }
    return;
  } catch (error) {
    console.log("🚀 ~ importFileParser ~ error:", error);
    return new Error(SERVER_ERROR);
  }
}
