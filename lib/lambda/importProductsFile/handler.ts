import { S3 } from "aws-sdk";
import { SERVER_ERROR } from "../../shared/constant";

export async function importProductsFile(request: any) {
  try {
    const fileName = request.name;
    const s3 = new S3();
    const bucketName = process.env.IMPORT_BUCKET_NAME;
    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: bucketName,
      Key: `uploaded/${fileName}`,
      Expires: 60,
    });

    return signedUrl;
  } catch (error) {
    return new Error(SERVER_ERROR);
  }
}
