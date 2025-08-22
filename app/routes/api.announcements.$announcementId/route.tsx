import { ActionFunctionArgs, LoaderFunctionArgs, json } from "react-router";
import { z } from "zod";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import {
  createAnnouncement,
  getAnnouncementsByCharity,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  canUserManageAnnouncements,
} from "~/models/announcements.server";

// Validation schemas
const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  content: z.string().min(1, "Content is required").max(2000, "Content too long"),
  charityId: z.string().min(1, "Charity ID is required"),
});

const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long").optional(),
  content: z.string().min(1, "Content is required").max(2000, "Content too long").optional(),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const charityId = url.searchParams.get("charityId");
  const announcementId = params.announcementId;

  // If we have an announcementId, get a specific announcement
  if (announcementId) {
    const { announcement, message, status } = await getAnnouncement(announcementId);
    return json({ announcement, message }, { status });
  }

  // If we have a charityId, get all announcements for that charity
  if (charityId) {
    const { announcements, message, status } = await getAnnouncementsByCharity(charityId);
    return json({ announcements, message }, { status });
  }

  return json({ error: "Either charityId or announcementId is required" }, { status: 400 });
}

export async function action({ request, params }: ActionFunctionArgs) {
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
  const announcementId = params.announcementId;

  switch (method) {
    case "POST": {
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

    case "PUT": {
      if (!announcementId) {
        return json({ error: "Announcement ID is required" }, { status: 400 });
      }

      try {
        // First, get the announcement to check permissions
        const { announcement: existingAnnouncement } = await getAnnouncement(announcementId);
        if (!existingAnnouncement) {
          return json({ error: "Announcement not found" }, { status: 404 });
        }

        // Check if user can manage announcements for this charity
        const canManage = await canUserManageAnnouncements(userInfo.id, existingAnnouncement.charityId);
        if (!canManage && existingAnnouncement.authorId !== userInfo.id) {
          return json({ error: "You don't have permission to edit this announcement" }, { status: 403 });
        }

        const formData = await request.formData();
        const data = Object.fromEntries(formData);
        
        const validatedData = UpdateAnnouncementSchema.parse(data);

        const result = await updateAnnouncement(announcementId, validatedData);
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

    case "DELETE": {
      if (!announcementId) {
        return json({ error: "Announcement ID is required" }, { status: 400 });
      }

      try {
        // First, get the announcement to check permissions
        const { announcement: existingAnnouncement } = await getAnnouncement(announcementId);
        if (!existingAnnouncement) {
          return json({ error: "Announcement not found" }, { status: 404 });
        }

        // Check if user can manage announcements for this charity
        const canManage = await canUserManageAnnouncements(userInfo.id, existingAnnouncement.charityId);
        if (!canManage && existingAnnouncement.authorId !== userInfo.id) {
          return json({ error: "You don't have permission to delete this announcement" }, { status: 403 });
        }

        const result = await deleteAnnouncement(announcementId);
        return json(result, { status: result.status });
      } catch (error) {
        return json({ error: "Internal server error" }, { status: 500 });
      }
    }

    default:
      return json({ error: "Method not allowed" }, { status: 405 });
  }
}