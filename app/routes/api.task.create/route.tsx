import { ActionFunctionArgs, redirect } from "react-router";
import { Meta, UppyFile } from "@uppy/core";
import { z } from "zod";
import { createTask } from "~/models/tasks.server";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import { TaskSchema } from "~/services/validators.server";

export async function loader() {
  return redirect("/dashboard/tasks");
}

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.formData();
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  if (!accessToken) {
    return redirect("/zitlogin");
  }

  const {
    userInfo,
    error: userError,
    charityMemberships,
  } = await getUserInfo(accessToken);

  if (!userInfo?.id) {
    console.log(userError);
    return redirect("/zitlogin");
  }

  try {
    const formData = JSON.parse(data.get("formData") as string);
    console.log("New Task Data", formData);

    // Get the charity ID from the form data
    const charityId = formData.charityId;

    if (!charityId) {
      return {
        error: [
          { path: ["charityId"], message: "Charity selection is required" },
        ],
      };
    }

    // Check if user has permission to create tasks for this charity
    const charityAdmin = charityMemberships?.memberships?.find(
      (membership) =>
        membership.charityId === charityId &&
        membership.roles.some((role) =>
          ["admin", "editor", "volunteer"].includes(role),
        ),
    );

    if (!charityAdmin) {
      return {
        error: [
          {
            path: ["charityId"],
            message:
              "You do not have permission to create tasks for this charity",
          },
        ],
      };
    }

    const validatedData = TaskSchema.parse({
      ...formData,
      deadline: formData.deadline,
      location: formData.location
        ? {
            address: formData.location.address,
            lat: formData.location.lat,
            lng: formData.location.lng,
          }
        : null,
      resources: (
        formData.resources as unknown as UppyFile<Meta, Record<string, never>>[]
      ).map((upload) => ({
        name: upload.name || null,
        extension: upload.extension || null,
        type: upload.type || null,
        size: upload.size || null,
        uploadURL: upload.uploadURL || null,
      })),
      tokenRewardAmount: formData.tokenRewardAmount,
      creatorWalletAddress: formData.creatorWalletAddress,
    });

    console.log("Validated Task Data", validatedData);

    // Create the task in the database
    const task = await createTask(validatedData, charityId, userInfo.id);
    console.log("New task created", task);

    // Note: Token escrow creation will be handled on the client-side
    // The frontend will use the WalletIntegration component to create the escrow
    // after the task is successfully created in the database

    return {
      error: null,
      task: task.task,
      message:
        "Task created successfully. You can now create the token escrow using your connected wallet.",
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log(err.errors);
      return { error: err.errors };
    }
    throw err;
  }
}
