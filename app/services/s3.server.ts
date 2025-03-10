import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Credentials } from "./env.server";

const { ACCESS_KEY_ID, SECRET_ACCESS_KEY } = getS3Credentials();

const s3 = new S3Client({
  region: "eu-west-2",
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});
export async function getSignedUrlForFile(
  fileName: string,
  extractFileName: boolean = false,
) {
  if (extractFileName) {
    fileName = decodeURIComponent(fileName.split(".com/")[1]);
  }
  
  const command = new GetObjectCommand({
    Bucket: "skillanthropy-uploads",
    Key: fileName,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1-hour expiry
}

export async function deleteS3Object(fileName: string) {
  const command = new DeleteObjectCommand({
    Bucket: "skillanthropy-uploads",
    Key: fileName,
  });

  try {
    await s3.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting object:", error);
    throw error;
  }
}
