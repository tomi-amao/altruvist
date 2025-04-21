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
  let keyToSign = fileName;

  if (extractFileName && fileName) {
    try {
      if (typeof fileName === "string" && fileName.includes(".com/")) {
        const parts = fileName.split(".com/");
        if (parts.length > 1) {
          // First decode using decodeURIComponent
          let decodedKey = decodeURIComponent(parts[1]);

          // Then manually replace any remaining '+' with spaces
          // This is needed because some URL-encoded spaces might be represented as '+'
          // and decodeURIComponent doesn't convert '+' to spaces
          decodedKey = decodedKey.replace(/\+/g, " ");

          keyToSign = decodedKey;
        } else {
          console.warn("Could not extract key from fileName:", fileName);
          keyToSign = fileName; // Fallback to original
        }
      } else {
        console.warn(
          "fileName doesn't contain '.com/' or is not a string:",
          fileName,
        );
        // If it's just a raw key, also check for '+' that might need replacing
        if (typeof fileName === "string" && fileName.includes("+")) {
          keyToSign = fileName.replace(/\+/g, " ");
        } else {
          keyToSign = fileName;
        }
      }
    } catch (error) {
      console.error("Error extracting/decoding key:", error);
      console.error("Original fileName that caused error:", fileName);
      return null;
    }
  } else {
    // Even when not extracting, check for '+' characters that might need replacing
    if (typeof keyToSign === "string" && keyToSign.includes("+")) {
      keyToSign = keyToSign.replace(/\+/g, " ");
    }
  }

  // Safety check for empty keys
  if (!keyToSign) {
    console.error("Empty key after processing. Original fileName:", fileName);
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: "skillanthropy-uploads",
    Key: keyToSign,
  });

  try {
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1-hour expiry
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL for key:", keyToSign);
    console.error("Error details:", error);
    return null; // Return null instead of throwing to avoid breaking the UI
  }
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
