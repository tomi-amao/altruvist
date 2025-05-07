import { LoaderFunctionArgs } from "react-router";
import { deleteS3Object, getSignedUrlForFile } from "~/services/s3.server";
import { getSession } from "~/services/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const fileUrl = url.searchParams.get("file");
  const action = url.searchParams.get("action");
  const key = url.searchParams.get("key");
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  // Check for either file or key parameter
  if (!fileUrl && !key) {
    return { error: "Either file URL or key is required" }
  }

  // Handle direct key request (for background images)
  if (key) {
    try {
      const signedUrl = await getSignedUrlForFile(key, true);
      return { url: signedUrl }
    } catch (error) {
      console.error("Error generating signed URL:", error);
      return { error: "Failed to generate signed URL" };
    }
  }

  // Original file URL-based logic
  if (!accessToken) {
    return { error: "Unauthorized" };
  }

  switch (action) {
    case "upload": {
      const fileName = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;

      if (!fileName) {
        return { error: "File name is required" };
      }

      const signedUrl = await getSignedUrlForFile(
        decodeURIComponent(fileName),
        true,
      );
      return { message: "Upload successful", url: signedUrl };
    }
    case "delete": {
      const deleteFile = await deleteS3Object(fileUrl);
      console.log("File deleted:", deleteFile);

      return { message: "Delete successful", url: null };
    }
    default:
      return { error: "Invalid action" };
  }
};
