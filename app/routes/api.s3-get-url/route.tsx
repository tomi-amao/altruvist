import { json, LoaderFunctionArgs } from "@remix-run/node";
import { deleteS3Object, getSignedUrlForFile } from "~/services/s3.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const fileUrl = url.searchParams.get("file");
  const action = url.searchParams.get("action");

  if (!fileUrl) {
    return json({ error: "File URL is required" }, { status: 400 });
  }

  switch (action) {
    case "upload": {
      const fileName = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;

      if (!fileName) {
        return json({ error: "File name is required" }, { status: 400 });
      }

      const signedUrl = await getSignedUrlForFile(decodeURIComponent(fileName));
      return json({ message: "Upload successful", url: signedUrl });
    }
    case "delete": {
      const deleteFile = await deleteS3Object(fileUrl);
      console.log("File deleted:", deleteFile);

      return json({ message: "Delete successful", url: null });
    }
    default:
      return json({ error: "Invalid action" }, { status: 400 });
  }
};
