import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { getUserInfo, deleteUser, updateUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import { z } from "zod";
import {
  deleteCharity,
  getCharityMemberships,
} from "~/models/charities.server";

// Type for action responses
type ActionResponse = {
  success?: boolean;
  message?: string;
  errors?: Array<{
    field: string;
    message?: string;
  }>;
};

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  const { userInfo, zitUserInfo } = await getUserInfo(
    session.get("accessToken"),
  );

  if (!userInfo) {
    return redirect("/zitlogin");
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  try {
    switch (action) {
      case "delete": {
        await deleteUser(userInfo.id, zitUserInfo.sub);
        return redirect("/zitlogout");
      }

      case "deleteCharity": {
        const charityId = formData.get("charityId") as string;

        if (!charityId) {
          return json(
            {
              errors: [{ field: "form", message: "Charity ID is required" }],
            },
            { status: 400 },
          );
        }

        // Check if user is admin or creator of the charity
        const { memberships } = await getCharityMemberships({
          userId: userInfo.id,
        });
        const creator = memberships?.some(
          (membership) =>
            membership.charityId === charityId &&
            membership.roles.includes("creator"),
        );

        if (!creator) {
          return json(
            {
              errors: [
                {
                  field: "form",
                  message: "You don't have permission to delete this charity",
                },
              ],
            },
            { status: 403 },
          );
        }

        // Delete the charity
        const { status, message } = await deleteCharity(charityId);

        if (status !== 200) {
          return json(
            {
              errors: [
                {
                  field: "form",
                  message: message || "Failed to delete charity",
                },
              ],
            },
            { status: 500 },
          );
        }

        return json({
          success: true,
          message: "Charity deleted successfully",
        });
      }

      case "updateProfile": {
        const rawFormData = formData.get("formData") as string;
        const updateProfileData = JSON.parse(rawFormData);

        const updateFields = {
          ...updateProfileData,
          profilePicture:
            updateProfileData.profilePicture || userInfo.profilePicture,
        };

        const userSchema = z.object({
          name: z
            .string()
            .min(1, "Name is required")
            .max(80, "Maximum of 50 characters"),
          userTitle: z
            .string()
            .min(1, "Title is required")
            .max(50, "Maximum of 50 characters")
            .optional()
            .or(z.literal("")),
          bio: z
            .string()
            .min(1, "Bio is required")
            .max(1000)
            .optional()
            .or(z.literal("")),
          ...((userInfo.roles[0] === "volunteer" && {
            preferredCharities: z
              .array(z.string())
              .min(1, "At least one charity category is required"),
          }) ||
            {}),
          ...((userInfo.roles[0] === "volunteer" && {
            skills: z
              .array(z.string())
              .min(1, "At least one skill is required"),
          }) ||
            {}),
          profilePicture: z
            .string()
            .min(1, "Profile picture is required")
            .optional()
            .or(z.literal(null)),
        });

        const validationResult = userSchema.safeParse(updateFields);
        if (!validationResult.success) {
          const response: ActionResponse = {
            errors: validationResult.error.errors.map((err) => ({
              field: err.path[0]?.toString() || "unknown",
              message: err.message,
            })),
          };

          return json(response, { status: 400 });
        }

        const { status } = await updateUserInfo(userInfo.id, updateFields);

        if (status !== 200) {
          return json(
            {
              errors: [{ field: "form", message: "Failed to update profile" }],
            },
            { status: 500 },
          );
        }

        return json({
          success: true,
          message: "Profile updated successfully",
        });
      }

      default:
        return json(
          {
            errors: [{ field: "form", message: "Invalid action" }],
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error(`Error occurred in action ${action}:`, error);

    return json(
      {
        errors: [{ field: "form", message: "An unexpected error occurred" }],
      },
      { status: 500 },
    );
  }
}
