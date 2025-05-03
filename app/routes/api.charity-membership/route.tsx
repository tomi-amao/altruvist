import { ActionFunctionArgs, json } from "@remix-run/node";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import {
  createCharityMembership,
  createCharityApplication,
  reviewCharityApplication,
  deleteCharityMembership,
  getCharityMemberships,
  updateCharityMembership,
  getCharity,
} from "~/models/charities.server";
import { z } from "zod";
import { triggerNotification } from "~/services/novu.server";

const JoinCharitySchema = z.object({
  action: z.enum(["join", "apply", "review"]),
  charityId: z.string().min(1, "Charity ID is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  permissions: z.array(z.string()).optional(),
  applicationNote: z.string().optional(),
});

const ReviewApplicationSchema = z.object({
  action: z.literal("review"),
  applicationId: z.string().min(1, "Application ID is required"),
  status: z.enum(["ACCEPTED", "REJECTED"]),
  reviewNote: z.string().optional(),
});

const LeaveCharitySchema = z.object({
  action: z.literal("leave"),
  charityId: z.string().min(1, "Charity ID is required"),
});

const UpdateMemberSchema = z.object({
  action: z.literal("updateMember"),
  memberId: z.string().min(1, "Member ID is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
});

const RemoveMemberSchema = z.object({
  action: z.literal("removeMember"),
  userId: z.string().min(1, "User ID is required"),
  charityId: z.string().min(1, "Charity ID is required"),
});

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const { userInfo } = await getUserInfo(accessToken);

  if (!userInfo) {
    return json(
      {
        success: false,
        message: "Unauthorized. Please log in.",
      },
      { status: 401 },
    );
  }

  const userId = userInfo.id;

  // Handle both form data and JSON data
  let data;
  const contentType = request.headers.get("Content-Type") || "";

  if (contentType.includes("application/json")) {
    data = await request.json();
  } else {
    // Handle form data (application/x-www-form-urlencoded)
    const formData = await request.formData();
    data = Object.fromEntries(formData);

    // Parse JSON strings if they exist
    if (typeof data.roles === "string" && data.roles.startsWith("[")) {
      try {
        data.roles = JSON.parse(data.roles);
      } catch (e) {
        console.error("Error parsing roles JSON:", e);
        data.roles = [];
      }
    }

    if (
      typeof data.permissions === "string" &&
      data.permissions.startsWith("[")
    ) {
      try {
        data.permissions = JSON.parse(data.permissions);
      } catch (e) {
        console.error("Error parsing permissions JSON:", e);
        data.permissions = [];
      }
    }
  }

  console.log("Received data:", data);

  // Handle different actions based on the request
  switch (data.action) {
    case "join": {
      // For regular volunteer joining (no approval needed)
      try {
        const validatedData = JoinCharitySchema.parse(data);

        const { charityId, roles, permissions = [] } = validatedData;

        // For regular volunteer/supporter roles, no approval needed
        const { membership, message, status } = await createCharityMembership({
          userId,
          charityId,
          roles,
          permissions,
        });

        const { charity } = await getCharity(charityId);
        const notifyTopicId =
          charity?.notifyTopicId.filter((id) => id.includes("admins"))[0] ||
          undefined;

        await triggerNotification({
          userInfo,
          workflowId: "charities-feed",
          notification: {
            subject: `${roles.join(", ").charAt(0).toUpperCase() + roles.slice(1)} Joined`,
            body: `${userInfo?.name} has joined the charity ${charity?.name} as a ${roles.join(", ")}`,
            type: "update",
            charityId: charityId,
          },
          type: "Topic",
          topicKey: notifyTopicId,
        });
        return json(
          {
            success: status === 200,
            message,
            membership,
          },
          { status },
        );
      } catch (error) {
        console.error("Error joining charity:", error);

        if (error instanceof z.ZodError) {
          return json(
            {
              success: false,
              message: "Validation error",
              errors: error.errors,
            },
            { status: 400 },
          );
        }

        return json(
          {
            success: false,
            message: "Failed to join charity",
          },
          { status: 500 },
        );
      }
    }

    case "apply": {
      // For admin role applications (requires approval)
      try {
        const validatedData = JoinCharitySchema.parse(data);

        const { charityId, roles, applicationNote } = validatedData;
        console.log("Applying to Charity", userId, charityId, roles);
        console.log("Application Note", applicationNote);

        // Create an application that requires approval
        const { application, message, status } = await createCharityApplication(
          {
            userId,
            charityId,
            roles,
            applicationNote,
          },
        );

        const { charity } = await getCharity(charityId);
        // const notifyTopicId = charity?.notifyTopicId.filter((id) => id.includes("coordinator")) || undefined;
        const topicKeys = [
          `charity:coordinators:${charity?.id}`,
          `charity:admins:${charity?.id}`,
        ];
        // Send notification to each topic key (coordinators and admins)
        for (const topicKey of topicKeys) {
          await triggerNotification({
            userInfo,
            workflowId: "charities-feed",
            notification: {
              subject: `${roles.join(", ").charAt(0).toUpperCase() + roles.slice(1)} Application`,
              body: `${userInfo?.name} has applied to join the charity ${charity?.name} as a ${roles.join(", ")}. Application Note: ${applicationNote}`,
              type: "update",
              charityId: charityId,
            },
            type: "Topic",
            topicKey: topicKey,
          });
        }

        return json(
          {
            success: status === 200,
            message,
            application,
          },
          { status },
        );
      } catch (error) {
        console.error("Error applying to charity:", error);

        if (error instanceof z.ZodError) {
          return json(
            {
              success: false,
              message: "Validation error",
              errors: error.errors,
            },
            { status: 400 },
          );
        }

        return json(
          {
            success: false,
            message: "Failed to submit application",
          },
          { status: 500 },
        );
      }
    }

    case "review": {
      // For charity admins to review applications
      try {
        const validatedData = ReviewApplicationSchema.parse(data);

        const {
          applicationId,
          status: applicationStatus,
          reviewNote,
        } = validatedData;

        // Review the application (approve or reject)
        const { application, message, status } = await reviewCharityApplication(
          applicationId,
          userId, // Reviewer ID
          {
            status: applicationStatus,
            reviewNote,
          },
        );

        return json(
          {
            success: status === 200,
            message,
            application,
          },
          { status },
        );
      } catch (error) {
        console.error("Error reviewing application:", error);

        if (error instanceof z.ZodError) {
          return json(
            {
              success: false,
              message: "Validation error",
              errors: error.errors,
            },
            { status: 400 },
          );
        }

        return json(
          {
            success: false,
            message: "Failed to review application",
          },
          { status: 500 },
        );
      }
    }

    case "leave": {
      // For users leaving a charity (deleting their membership)
      try {
        const validatedData = LeaveCharitySchema.parse(data);
        const { charityId } = validatedData;
        console.log("Leaving Charity", userId, charityId);

        // Check if user is the last admin before allowing them to leave
        const { charityMemberships } = await getUserInfo(accessToken);
        const membership = charityMemberships?.memberships?.find(
          (m) => m.charityId === charityId && m.userId === userId,
        );

        // If user is an admin, check if they're the last admin
        if (membership?.roles.includes("admin")) {
          // Get all admins for this charity
          const { memberships } = await getCharityMemberships({ charityId });
          const adminCount =
            memberships?.filter((m) => m.roles.includes("admin")).length || 0;

          // If user is the only admin, don't allow them to leave
          if (adminCount <= 1) {
            console.log("User is the only admin of this charity");
            return json(
              {
                success: false,
                message:
                  "You are the only admin of this charity. Please appoint another admin before leaving.",
              },
              { status: 400 },
            );
          }
        }

        // If all checks pass, delete the membership
        const { message, status } = await deleteCharityMembership(
          userId,
          charityId,
        );
        console.log("Membership deleted:", message);

        return json(
          {
            success: status === 200,
            message,
          },
          { status },
        );
      } catch (error) {
        console.error("Error leaving charity:", error);

        if (error instanceof z.ZodError) {
          return json(
            {
              success: false,
              message: "Validation error",
              errors: error.errors,
            },
            { status: 400 },
          );
        }

        return json(
          {
            success: false,
            message: "Failed to leave charity",
          },
          { status: 500 },
        );
      }
    }

    case "updateMember": {
      // For charity admins to update a member's roles
      try {
        const validatedData = UpdateMemberSchema.parse(data);
        const { memberId, roles } = validatedData;
        console.log("Updating member:", memberId, "with roles:", roles);

        // Find the membership to get userId and charityId
        // First, get the charity memberships for the current user
        const { charityMemberships } = await getUserInfo(accessToken);

        // Get all memberships for the admin's charities
        const adminCharities =
          charityMemberships?.memberships
            ?.filter((m) => m.roles.includes("admin"))
            .map((m) => m.charityId) || [];

        // If user is not an admin of any charity, deny access
        if (adminCharities.length === 0) {
          return json(
            {
              success: false,
              message:
                "Unauthorized: You must be a charity admin to update member roles",
            },
            { status: 403 },
          );
        }

        // Find the target membership
        const { memberships } = await getCharityMemberships({});
        const targetMembership = memberships?.find((m) => m.id === memberId);

        if (!targetMembership) {
          return json(
            {
              success: false,
              message: "Member not found",
            },
            { status: 404 },
          );
        }

        // Verify the admin has permissions for this charity
        if (!adminCharities.includes(targetMembership.charityId)) {
          return json(
            {
              success: false,
              message:
                "Unauthorized: You can only manage members of charities you administer",
            },
            { status: 403 },
          );
        }

        // If the member is the only admin, ensure at least one admin role remains
        if (
          targetMembership.roles.includes("admin") &&
          !roles.includes("admin")
        ) {
          // Check if this is the only admin
          const { memberships: charityMemberships } =
            await getCharityMemberships({
              charityId: targetMembership.charityId,
            });
          const adminCount =
            charityMemberships?.filter((m) => m.roles.includes("admin"))
              .length || 0;

          if (adminCount <= 1) {
            return json(
              {
                success: false,
                message:
                  "Cannot remove admin role: This is the only admin of the charity",
              },
              { status: 400 },
            );
          }
        }

        // Update the membership with new roles
        const { membership, message, status } = await updateCharityMembership(
          targetMembership.userId,
          targetMembership.charityId,
          { roles },
        );

        return json(
          {
            success: status === 200,
            message,
            membership,
          },
          { status },
        );
      } catch (error) {
        console.error("Error updating member roles:", error);

        if (error instanceof z.ZodError) {
          return json(
            {
              success: false,
              message: "Validation error",
              errors: error.errors,
            },
            { status: 400 },
          );
        }

        return json(
          {
            success: false,
            message: "Failed to update member roles",
          },
          { status: 500 },
        );
      }
    }

    case "removeMember": {
      // For charity admins to remove a member
      try {
        const validatedData = RemoveMemberSchema.parse(data);
        const { userId: memberUserId, charityId } = validatedData;
        console.log(
          "Removing member:",
          memberUserId,
          "from charity:",
          charityId,
        );

        // Verify the current user is an admin of this charity
        const { charityMemberships } = await getUserInfo(accessToken);
        const adminMembership = charityMemberships?.memberships?.find(
          (m) => m.charityId === charityId && m.roles.includes("admin"),
        );

        if (!adminMembership) {
          return json(
            {
              success: false,
              message:
                "Unauthorized: You must be a charity admin to remove members",
            },
            { status: 403 },
          );
        }

        // Check if the member to remove is the only admin
        if (memberUserId === userId) {
          // If removing self, use the 'leave' action logic instead
          return json(
            {
              success: false,
              message:
                "Cannot remove yourself. Use the 'leave' action instead.",
            },
            { status: 400 },
          );
        }

        // Get the membership to check if it's the only admin
        const { memberships } = await getCharityMemberships({ charityId });
        const targetMembership = memberships?.find(
          (m) => m.userId === memberUserId,
        );

        if (!targetMembership) {
          return json(
            {
              success: false,
              message: "Member not found",
            },
            { status: 404 },
          );
        }

        // If the member is an admin, check if they're the only one
        if (targetMembership.roles.includes("admin")) {
          const adminCount =
            memberships?.filter((m) => m.roles.includes("admin")).length || 0;

          if (adminCount <= 1) {
            return json(
              {
                success: false,
                message: "Cannot remove the only admin of the charity",
              },
              { status: 400 },
            );
          }
        }

        // Remove the membership
        const { message, status } = await deleteCharityMembership(
          memberUserId,
          charityId,
        );

        return json(
          {
            success: status === 200,
            message,
          },
          { status },
        );
      } catch (error) {
        console.error("Error removing member:", error);

        if (error instanceof z.ZodError) {
          return json(
            {
              success: false,
              message: "Validation error",
              errors: error.errors,
            },
            { status: 400 },
          );
        }

        return json(
          {
            success: false,
            message: "Failed to remove member",
          },
          { status: 500 },
        );
      }
    }

    default:
      return json(
        {
          success: false,
          message: "Invalid action",
        },
        { status: 400 },
      );
  }
}
