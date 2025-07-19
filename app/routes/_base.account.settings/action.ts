import { ActionFunctionArgs, redirect } from "react-router";
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
  const accessToken = session.get("accessToken");

  if (!accessToken) {
    return redirect("/zitlogin");
  }

  const { userInfo, zitUserInfo } = await getUserInfo(accessToken);

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
          return {
            errors: [{ field: "form", message: "Charity ID is required" }],
          };
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
          return {
            errors: [
              {
                field: "form",
                message: "You don't have permission to delete this charity",
              },
            ],
          };
        }

        // Delete the charity
        const { status, message } = await deleteCharity(charityId);

        if (status !== 200) {
          return {
            errors: [
              {
                field: "form",
                message: message || "Failed to delete charity",
              },
            ],
          };
        }

        return {
          success: true,
          message: "Charity deleted successfully",
        };
      }

      case "updateProfile": {
        const rawFormData = formData.get("formData") as string;
        const updateProfileData = JSON.parse(rawFormData);
        console.log("Update Profile Data", updateProfileData);

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
          walletPublicKey: z
            .string()
            .optional()
            .or(z.literal(""))
            .refine((val) => {
              if (!val || val === "") return true; // Optional field
              // Basic Solana public key validation (44 characters, base58)
              return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val);
            }, "Invalid Solana wallet public key format"),
          ...(userInfo.roles[0] === "volunteer"
            ? {
                preferredCharities: z
                  .array(z.string())
                  .min(1, "At least one charity category is required")
                  .optional(),
                skills: z
                  .array(z.string())
                  .min(1, "At least one skill is required")
                  .optional(),
              }
            : {}),
          profilePicture: z
            .string()
            .optional()
            .or(z.literal(""))
            .or(z.literal(null))
            .transform((val) => {
              // Sanitize the profile picture URL
              if (!val || val === null) return "";
              if (typeof val === "string") {
                const trimmed = val.trim();
                // Return empty string if it's just whitespace
                return trimmed === "" ? "" : trimmed;
              }
              return "";
            })
            .refine((val) => {
              // Allow empty strings
              if (!val || val === "") return true;
              // Basic URL validation for profile pictures
              try {
                new URL(val);
                return true;
              } catch {
                return false;
              }
            }, "Profile picture must be a valid URL or empty"),
        });

        const validationResult = userSchema.safeParse(updateFields);

        if (!validationResult.success) {
          const response: ActionResponse = {
            errors: validationResult.error.errors.map((err) => ({
              field: err.path[0]?.toString() || "unknown",
              message: err.message,
            })),
          };

          return response;
        }

        const { status, error } = await updateUserInfo(
          userInfo.id,
          updateFields,
        );

        if (status !== 200) {
          return {
            errors: [
              {
                field: "form",
                message: error || "Failed to update profile",
              },
            ],
          };
        }

        return {
          success: true,
          message: "Profile updated successfully",
        };
      }

      default:
        return {
          errors: [{ field: "form", message: "Invalid action" }],
        };
    }
  } catch (error) {
    console.error(`Error occurred in action ${action}:`, error);

    return {
      errors: [{ field: "form", message: "An unexpected error occurred" }],
    };
  }
}
