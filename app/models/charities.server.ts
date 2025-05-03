import { charities, ApplicationStatus, type Prisma } from "@prisma/client";
import { prisma } from "~/services/db.server";
import {
  INDICES,
  indexDocument,
  deleteDocument,
  isMeilisearchConnected,
} from "~/services/meilisearch.server";
import {
  addNovuSubscriberToTopic,
  createTopic,
  triggerNotification,
} from "~/services/novu.server";
import { getUserById } from "./user2.server";

export const createCharity = async (
  charityData: Partial<charities>,
  userId: string,
) => {
  try {
    // Create the charity
    const charity = await prisma.charities.create({
      data: {
        name: charityData.name ?? "",
        description: charityData.description ?? "",
        website: charityData.website,
        contactEmail: charityData.contactEmail ?? undefined,
        tags: charityData.tags,
        backgroundPicture: charityData.backgroundPicture, // Explicitly adding backgroundPicture field
      },
    });

    if (!charity) {
      return { charity: null, message: "No charity Found", status: 404 };
    }
    const { topicKey: volunteersTopicKey } = await createTopic(
      `charity:volunteers:${charity?.id}`,
      charity?.name,
    );
    const { topicKey: coordinatorTopicKey } = await createTopic(
      `charity:coordinators:${charity?.id}`,
      charity?.name,
    );
    const { topicKey: adminTopicKey } = await createTopic(
      `charity:admins:${charity?.id}`,
      charity?.name,
    );

    if (!volunteersTopicKey || !coordinatorTopicKey || !adminTopicKey) {
      throw new Error("Failed to create topic keys");
    }
    await addNovuSubscriberToTopic([userId], adminTopicKey);

    if (!volunteersTopicKey || !coordinatorTopicKey || !adminTopicKey) {
      throw new Error("Failed to create topic keys");
    }
    await prisma.charities.update({
      where: { id: charity.id },
      data: {
        notifyTopicId: [volunteersTopicKey, coordinatorTopicKey, adminTopicKey],
      },
    });

    // Create the charity membership with creator role
    await createCharityMembership({
      userId,
      charityId: charity.id,
      roles: ["creator", "admin"],
      permissions: ["create_task", "approve_volunteers", "manage_charity"],
    });

    // Index the new charity in Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await indexDocument(INDICES.CHARITIES, charity);
    }

    return { charity, message: "Charity successfully created", status: 200 };
  } catch (error) {
    console.error("Error creating charity:", error);
    return {
      charity: null,
      message: `Unable to create charity: ${error}`,
      status: 500,
    };
  }
};

export const getCharity = async (
  id: string,
  include?: Prisma.charitiesInclude,
) => {
  try {
    const charity = await prisma.charities.findUnique({
      where: { id },
      ...(include && { include }),
    });
    return { charity, message: "Found charity", status: 200 };
  } catch (error) {
    return {
      charity: null,
      message: `Unable to find charity: ${error}`,
      status: 500,
    };
  }
};

export const updateCharity = async (
  id: string,
  charityData: Prisma.charitiesUpdateInput,
) => {
  try {
    const charity = await prisma.charities.findUnique({
      where: { id },
    });
    if (!charity) {
      return { message: "No charity Found", status: 404 };
    }
    const updatedCharity = await prisma.charities.update({
      where: { id },
      data: charityData,
    });

    // Update the charity in Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await indexDocument(INDICES.CHARITIES, updatedCharity);
    }

    return {
      charity,
      message: `Updated Charity ${updatedCharity}`,
      status: 200,
    };
  } catch (error) {
    console.error("Error updating charity:", error);
    return {
      charity: null,
      message: `Unable to find charity`,
      status: 500,
      error,
    };
  }
};

export const deleteCharity = async (id: string) => {
  try {
    const charity = await prisma.charities.findUnique({
      where: { id },
    });
    if (!charity) {
      return { message: "No charity Found", status: 404 };
    }
    await prisma.charities.delete({
      where: { id },
    });

    // Delete the charity from Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await deleteDocument(INDICES.CHARITIES, id);
    }

    return { message: "Charity deleted", status: 200 };
  } catch (error) {
    return {
      charity: null,
      message: `Unable to find charity: ${error}`,
      status: 500,
    };
  }
};

export const listCharities = async () => {
  try {
    const charities = await prisma.charities.findMany();
    return { charities, message: "Found charities", status: 200 };
  } catch (error) {
    return {
      charities: null,
      message: `Unable to find charities: ${error}`,
      status: 500,
    };
  }
};

// New charity membership functions

interface CharityMembershipData {
  userId: string;
  charityId: string;
  roles: string[];
  permissions: string[];
}

/**
 * Create a charity membership for a user
 * This establishes a relationship between a user and a charity with specific roles and permissions
 */
export const createCharityMembership = async (data: CharityMembershipData) => {
  try {
    const { userId, charityId, roles, permissions } = data;

    // Check if the membership already exists
    const existingMembership = await prisma.charityMemberships.findUnique({
      where: {
        userId_charityId: {
          userId,
          charityId,
        },
      },
    });

    if (existingMembership) {
      return {
        membership: existingMembership,
        message: "Membership already exists",
        status: 200,
      };
    }

    // Create the membership
    const membership = await prisma.charityMemberships.create({
      data: {
        user: { connect: { id: userId } },
        charity: { connect: { id: charityId } },
        roles,
        permissions,
        joinedAt: new Date(),
      },
      include: {
        user: true,
        charity: true,
      },
    });

    console.log("Charity Membership created:", membership);

    return {
      membership,
      message: "Charity membership successfully created",
      status: 200,
    };
  } catch (error) {
    return {
      membership: null,
      message: `Unable to create charity membership: ${error}`,
      status: 500,
    };
  }
};

/**
 * Update an existing charity membership
 * Used to change a user's roles or permissions within a charity
 */
export const updateCharityMembership = async (
  userId: string,
  charityId: string,
  data: { roles?: string[]; permissions?: string[] },
) => {
  try {
    // Check if the membership exists
    const existingMembership = await prisma.charityMemberships.findUnique({
      where: {
        userId_charityId: {
          userId,
          charityId,
        },
      },
    });

    if (!existingMembership) {
      return {
        membership: null,
        message: "Membership does not exist",
        status: 404,
      };
    }

    // Update the membership
    const membership = await prisma.charityMemberships.update({
      where: {
        userId_charityId: {
          userId,
          charityId,
        },
      },
      data: {
        roles: data.roles !== undefined ? data.roles : undefined,
        permissions:
          data.permissions !== undefined ? data.permissions : undefined,
      },
      include: {
        user: true,
        charity: true,
      },
    });

    return {
      membership,
      message: "Charity membership successfully updated",
      status: 200,
    };
  } catch (error) {
    return {
      membership: null,
      message: `Unable to update charity membership: ${error}`,
      status: 500,
    };
  }
};

/**
 * Get all memberships for a user or charity
 */
export const getCharityMemberships = async ({
  userId,
  charityId,
}: {
  userId?: string;
  charityId?: string;
}) => {
  try {
    // Build the where clause based on what was provided
    const where: Prisma.charityMembershipsWhereInput = {};
    if (userId) where.userId = userId;
    if (charityId) where.charityId = charityId;

    const memberships = await prisma.charityMemberships.findMany({
      where,
      include: {
        user: true,
        charity: true,
      },
    });

    return {
      memberships,
      message: "Found charity memberships",
      status: 200,
    };
  } catch (error) {
    return {
      memberships: null,
      message: `Unable to find charity memberships: ${error}`,
      status: 500,
    };
  }
};

/**
 * Delete a charity membership
 * Use this when a user leaves a charity
 */
export const deleteCharityMembership = async (
  userId: string,
  charityId: string,
) => {
  try {
    // Check if the membership exists
    const existingMembership = await prisma.charityMemberships.findUnique({
      where: {
        userId_charityId: {
          userId,
          charityId,
        },
      },
    });

    if (!existingMembership) {
      return {
        message: "Membership does not exist",
        status: 404,
      };
    }

    // Delete the membership
    await prisma.charityMemberships.delete({
      where: {
        userId_charityId: {
          userId,
          charityId,
        },
      },
    });

    return {
      message: "Charity membership successfully deleted",
      status: 200,
    };
  } catch (error) {
    return {
      message: `Unable to delete charity membership: ${error}`,
      status: 500,
    };
  }
};

// New charity application functions

interface CharityApplicationData {
  userId: string;
  charityId: string;
  roles: string[];
  applicationNote?: string;
}

/**
 * Create a charity membership application
 * This creates a pending application that charity admins can review
 */
export const createCharityApplication = async (
  data: CharityApplicationData,
) => {
  try {
    const { userId, charityId, roles, applicationNote } = data;

    // Check if there's an active membership already
    const existingMembership = await prisma.charityMemberships.findUnique({
      where: {
        userId_charityId: {
          userId,
          charityId,
        },
      },
    });

    if (existingMembership) {
      return {
        application: null,
        message: "User is already a member of this charity",
        status: 400,
      };
    }

    // Check if there's a pending application already
    const existingApplication = await prisma.charityApplications.findUnique({
      where: {
        userId_charityId: {
          userId,
          charityId,
        },
      },
    });

    if (existingApplication) {
      // Return the existing application if it's still pending
      if (existingApplication.status === "PENDING") {
        return {
          application: existingApplication,
          message: "Application already exists and is pending review",
          status: 200,
        };
      }

      // Update the existing application if it was rejected
      if (existingApplication.status === "REJECTED") {
        const updatedApplication = await prisma.charityApplications.update({
          where: {
            id: existingApplication.id,
          },
          data: {
            roles,
            applicationNote,
            status: "PENDING",
            appliedAt: new Date(),
            reviewedAt: null,
            reviewedBy: null,
            reviewNote: null,
          },
          include: {
            user: true,
            charity: true,
          },
        });

        return {
          application: updatedApplication,
          message: "Application resubmitted successfully",
          status: 200,
        };
      }
    }

    // Create a new application
    const application = await prisma.charityApplications.create({
      data: {
        user: { connect: { id: userId } },
        charity: { connect: { id: charityId } },
        roles,
        applicationNote,
        status: "PENDING",
        appliedAt: new Date(),
      },
      include: {
        user: true,
        charity: true,
      },
    });

    return {
      application,
      message: "Charity application submitted successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error creating charity application:", error);
    return {
      application: null,
      message: `Unable to create charity application: ${error}`,
      status: 500,
    };
  }
};

/**
 * Get charity applications
 * Retrieves applications for a charity or from a user
 */
export const getCharityApplications = async ({
  userId,
  charityId,
  status,
}: {
  userId?: string;
  charityId?: string;
  status?: ApplicationStatus;
}) => {
  try {
    // Build the where clause based on what was provided
    const where: Prisma.charityApplicationsWhereInput = {};
    if (userId) where.userId = userId;
    if (charityId) where.charityId = charityId;
    if (status) where.status = status;

    const applications = await prisma.charityApplications.findMany({
      where,
      include: {
        user: true,
        charity: true,
      },
      orderBy: {
        appliedAt: "desc",
      },
    });

    return {
      applications,
      message: "Found charity applications",
      status: 200,
    };
  } catch (error) {
    console.error("Error getting charity applications:", error);
    return {
      applications: null,
      message: `Unable to find charity applications: ${error}`,
      status: 500,
    };
  }
};

/**
 * Delete a charity application
 * Used by charity admins to delete applications
 */

export const deleteCharityApplication = async (applicationId: string) => {
  try {
    // Check if the application exists
    const existingApplication = await prisma.charityApplications.findUnique({
      where: { id: applicationId },
    });

    if (!existingApplication) {
      return {
        message: "Application not found",
        status: 404,
      };
    }

    // Delete the application
    await prisma.charityApplications.delete({
      where: { id: applicationId },
    });

    return {
      message: "Charity application deleted successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error deleting charity application:", error);
    return {
      message: `Unable to delete charity application: ${error}`,
      status: 500,
    };
  }
};

/**
 * Review a charity application
 * Used by charity admins to approve or reject applications
 */
export const reviewCharityApplication = async (
  applicationId: string,
  reviewerId: string,
  decision: {
    status: ApplicationStatus;
    reviewNote?: string;
  },
) => {
  try {
    // Get the application details
    const application = await prisma.charityApplications.findUnique({
      where: { id: applicationId },
      include: { user: true, charity: true },
    });

    if (!application) {
      return {
        message: "Application not found",
        status: 404,
      };
    }

    // Make sure the reviewer is an admin of the charity
    const reviewerMembership = await prisma.charityMemberships.findUnique({
      where: {
        userId_charityId: {
          userId: reviewerId,
          charityId: application.charityId,
        },
      },
    });

    if (!reviewerMembership || !reviewerMembership.roles.includes("admin")) {
      return {
        message: "Unauthorized: Reviewer is not an admin of this charity",
        status: 403,
      };
    }

    // Update the application with the review
    const updatedApplication = await prisma.charityApplications.update({
      where: { id: applicationId },
      data: {
        status: decision.status,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNote: decision.reviewNote,
      },
      include: {
        user: true,
        charity: true,
      },
    });

    // If the application is approved, create a membership
    if (decision.status === "ACCEPTED") {
      await createCharityMembership({
        userId: application.userId,
        charityId: application.charityId,
        roles: application.roles,
        permissions: application.roles.includes("admin")
          ? ["create_task", "approve_volunteers", "manage_charity"]
          : ["view_charity_details"],
      });
      // delete the application after creating the membership
      await deleteCharityApplication(applicationId);

      const charity = await getCharity(application.charityId);
      if (!charity) {
        return {
          message: "Charity not found",
          status: 404,
        };
      }
      const { user: userInfo } = await getUserById(application.userId);
      await triggerNotification({
        userInfo,
        workflowId: "applications-feed",
        notification: {
          subject: "Application Update",
          body: `${userInfo?.name} has accepted your application for the charity ${charity?.charity?.name}`,
          type: "application",
          applicationId: applicationId,
          charityId: application.charityId,
        },
        type: "Subscriber",
      });
      const notifyTopicId =
        charity.charity?.notifyTopicId.filter((id) =>
          id.includes("volunteers"),
        )[0] || null;

      if (notifyTopicId) {
        await addNovuSubscriberToTopic([application?.userId], notifyTopicId);
      } else {
        console.error(
          "No notifyTopicId found for charity:",
          charity.charity?.id,
        );
      }
    } else if (decision.status === "REJECTED") {
      await deleteCharityApplication(applicationId);
    }

    return {
      application: updatedApplication,
      message: `Application ${decision.status.toLowerCase()}`,
      status: 200,
    };
  } catch (error) {
    console.error("Error reviewing charity application:", error);
    return {
      application: null,
      message: `Unable to review charity application: ${error}`,
      status: 500,
    };
  }
};
