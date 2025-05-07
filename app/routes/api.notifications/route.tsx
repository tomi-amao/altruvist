import {  LoaderFunction } from "react-router";
import { deleteNovuMessage } from "~/services/novu.server";
import { getSession } from "~/services/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const subscriberId = url.searchParams.get("subscriberId");
  const action = url.searchParams.get("action");
  console.log("subscriberId:", subscriberId);
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  if (!accessToken) {
    return { error: "Unauthorized" };
  }

  try {
    if (action === "delete") {
      const messageId = url.searchParams.get("messageId");

      const result = await deleteNovuMessage(messageId!);
      return { result };
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { error: "Failed to fetch notifications" };
  }
};
