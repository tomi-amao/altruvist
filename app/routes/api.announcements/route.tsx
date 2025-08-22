import { ActionFunctionArgs, LoaderFunctionArgs, json } from "react-router";
import { z } from "zod";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import {
  createAnnouncement,
  getAnnouncementsByCharity,
  canUserManageAnnouncements,
} from "~/models/announcements.server";

// Validation schemas
const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  content: z.string().min(1, "Content is required").max(2000, "Content too long"),
  charityId: z.string().min(1, "Charity ID is required"),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const charityId = url.searchParams.get("charityId");

  if (!charityId) {
    return json({ error: "Charity ID is required" }, { status: 400 });
  }

  const { announcements, message, status } = await getAnnouncementsByCharity(charityId);
  return json({ announcements, message }, { status });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  
  if (!accessToken) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userInfo } = await getUserInfo(accessToken);
  if (!userInfo) {
    return json({ error: "User not found" }, { status: 404 });
  }

  const method = request.method;

  if (method === "POST") {
    try {
      const formData = await request.formData();
      const data = Object.fromEntries(formData);
      
      const validatedData = CreateAnnouncementSchema.parse(data);
      const { title, content, charityId } = validatedData;

      // Check if user can manage announcements for this charity
      const canManage = await canUserManageAnnouncements(userInfo.id, charityId);
      if (!canManage) {
        return json({ error: "You don't have permission to create announcements for this charity" }, { status: 403 });
      }

      const result = await createAnnouncement({
        title,
        content,
        charityId,
        authorId: userInfo.id,
      });

      return json(result, { status: result.status });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return json({
          error: "Validation error",
          issues: error.errors,
        }, { status: 400 });
      }
      return json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}