import { S3 } from "aws-sdk";
import { SERVER_ERROR } from "../../shared/constant";

export async function importProductsFile(request: any) {
  console.log("🚀 ~ main ~ request:", request);
  try {
    const fileName = request.name;
    console.log("🚀 ~ importProductsFile ~ fileName:", fileName);
    const s3 = new S3();
    const bucketName = process.env.IMPORT_BUCKET_NAME;
    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: bucketName,
      Key: `uploaded/${fileName}`,
      Expires: 60,
    });

    console.log("🚀 ~ importProductsFile ~ signedUrl:", signedUrl);
    return signedUrl;
  } catch (error) {
    console.log("🚀 ~ importProductsFile ~ error:", error);
    return new Error(SERVER_ERROR);
  }
}
