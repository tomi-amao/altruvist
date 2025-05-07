import { ActionFunctionArgs } from "react-router";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import {
  deleteCharity,
  reviewCharityApplication,
  updateCharity,
} from "~/models/charities.server";

export async function action({ request }: ActionFunctionArgs) {
  // Authentication check
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  if (!accessToken) {
    return { error: "Unauthorized" };
  }

  const { userInfo } = await getUserInfo(accessToken);

  if (!userInfo?.id) {
    return { error: "Unauthorized" };
  }

  // Process form data
  const formData = await request.formData();
  const actionType = formData.get("_action")?.toString();

  try {
    // Route to appropriate handler based on action type
    switch (actionType) {
      case "updateCharity":
        return handleUpdateCharity(formData);

      case "deleteCharity":
        return handleDeleteCharity(formData);

      case "reviewApplication":
        return handleReviewApplication(formData, userInfo.id);

      default:
        return { error: "Invalid action" };
    }
  } catch (error) {
    console.error("Action error:", error);
    return {
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

// Handler for charity updates
async function handleUpdateCharity(formData: FormData) {
  const charityId = formData.get("charityId")?.toString();
  const charityDataStr = formData.get("charityData")?.toString();

  // Validate required fields
  if (!charityId || !charityDataStr) {
    return { error: "Charity ID and data are required" };
  }

  try {
    const charityData = JSON.parse(charityDataStr);
    const result = await updateCharity(charityId, charityData);

    if (result.status !== 200) {
      return { error: result.message };
    }

    return { success: true, charity: result.charity };
  } catch (error) {
    throw new Error(
      `Failed to update charity: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Handler for charity deletion
async function handleDeleteCharity(formData: FormData) {
  const charityId = formData.get("charityId")?.toString();

  // Validate required fields
  if (!charityId) {
    return { error: "Charity ID is required" };
  }

  try {
    const result = await deleteCharity(charityId);

    if (result.status !== 200) {
      return { error: result.message };
    }

    return { success: true };
  } catch (error) {
    throw new Error(
      `Failed to delete charity: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Handler for charity application reviews
async function handleReviewApplication(formData: FormData, userId: string) {
  const applicationId = formData.get("applicationId")?.toString();
  const status = formData.get("status")?.toString();
  const reviewNote = formData.get("reviewNote")?.toString();

  // Validate required fields
  if (!applicationId || !status) {
    return { error: "Application ID and status are required" };
  }

  // Validate status values
  if (status !== "ACCEPTED" && status !== "REJECTED") {
    return { error: "Invalid status" };
  }

  try {
    const result = await reviewCharityApplication(applicationId, userId, {
      status: status as "ACCEPTED" | "REJECTED",
      reviewNote: reviewNote || undefined,
    });

    if (result.status !== 200) {
      return { error: result.message };
    }

    return { success: true, application: result.application };
  } catch (error) {
    throw new Error(
      `Failed to review application: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
