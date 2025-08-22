import { announcements, type Prisma } from "@prisma/client";
import { prisma } from "~/services/db.server";
import { triggerNotification } from "~/services/novu.server";
import { getUserById } from "./user2.server";
import { getCharity } from "./charities.server";

export const createAnnouncement = async (
  announcementData: {
    title: string;
    content: string;
    charityId: string;
    authorId: string;
  }
) => {
  try {
    const { title, content, charityId, authorId } = announcementData;

    // Create the announcement
    const announcement = await prisma.announcements.create({
      data: {
        title,
        content,
        charityId,
        authorId,
      },
      include: {
        author: true,
        charity: true,
      },
    });

    // Get charity details for notification
    const { charity } = await getCharity(charityId);
    const { user: authorInfo } = await getUserById(authorId);

    if (charity && authorInfo) {
      // Send notification to all charity followers (volunteers topic)
      const notifyTopicId = charity.notifyTopicId?.find((id) =>
        id.includes("volunteers")
      );

      if (notifyTopicId) {
        await triggerNotification({
          userInfo: authorInfo,
          workflowId: "charities-feed",
          notification: {
            subject: `New Announcement from ${charity.name}`,
            body: `${charity.name} has posted a new announcement: "${title}"`,
            type: "announcement",
            charityId: charityId,
            announcementId: announcement.id,
          },
          type: "Topic",
          topicKey: notifyTopicId,
        });
      }
    }

    return {
      announcement,
      message: "Announcement created successfully",
      status: 201,
    };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return {
      announcement: null,
      message: `Unable to create announcement: ${error}`,
      status: 500,
    };
  }
};

export const getAnnouncementsByCharity = async (
  charityId: string,
  include?: Prisma.announcementsInclude
) => {
  try {
    const announcements = await prisma.announcements.findMany({
      where: {
        charityId,
      },
      include: {
        author: true,
        charity: include?.charity || false,
        ...include,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      announcements,
      message: "Announcements retrieved successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error retrieving announcements:", error);
    return {
      announcements: [],
      message: `Unable to retrieve announcements: ${error}`,
      status: 500,
    };
  }
};

export const getAnnouncement = async (
  id: string,
  include?: Prisma.announcementsInclude
) => {
  try {
    const announcement = await prisma.announcements.findUnique({
      where: { id },
      include: {
        author: true,
        charity: true,
        ...include,
      },
    });

    if (!announcement) {
      return {
        announcement: null,
        message: "Announcement not found",
        status: 404,
      };
    }

    return {
      announcement,
      message: "Announcement retrieved successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error retrieving announcement:", error);
    return {
      announcement: null,
      message: `Unable to retrieve announcement: ${error}`,
      status: 500,
    };
  }
};

export const updateAnnouncement = async (
  id: string,
  updateData: {
    title?: string;
    content?: string;
  }
) => {
  try {
    const announcement = await prisma.announcements.update({
      where: { id },
      data: updateData,
      include: {
        author: true,
        charity: true,
      },
    });

    return {
      announcement,
      message: "Announcement updated successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return {
      announcement: null,
      message: `Unable to update announcement: ${error}`,
      status: 500,
    };
  }
};

export const deleteAnnouncement = async (id: string) => {
  try {
    await prisma.announcements.delete({
      where: { id },
    });

    return {
      message: "Announcement deleted successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return {
      message: `Unable to delete announcement: ${error}`,
      status: 500,
    };
  }
};

export const canUserManageAnnouncements = async (
  userId: string,
  charityId: string
): Promise<boolean> => {
  try {
    const membership = await prisma.charityMemberships.findUnique({
      where: {
        userId_charityId: {
          userId,
          charityId,
        },
      },
    });

    // Check if user has admin or coordinator role in the charity
    return (
      membership &&
      (membership.roles.includes("admin") ||
        membership.roles.includes("coordinator") ||
        membership.roles.includes("creator"))
    );
  } catch (error) {
    console.error("Error checking user permissions:", error);
    return false;
  }
};