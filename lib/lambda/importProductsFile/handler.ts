import { S3 } from "aws-sdk";
import { ImportServiceBucket, SERVER_ERROR } from "../../shared/constant";

export async function importProductsFile(request: any) {
  console.log("🚀 ~ main ~ request:", request);
  try {
    const fileName = request;
    const s3 = new S3();
    const signedUrl = s3.getSignedUrl("putObject", {
      Bucket: ImportServiceBucket,
      Key: `uploaded/${fileName}`,
      Expires: 60,
      ContentType: "text/csv",
    });

    return signedUrl;
  } catch (error) {
    console.log("🚀 ~ importProductsFile ~ error:", error);
    return new Error(SERVER_ERROR);
  }
}
