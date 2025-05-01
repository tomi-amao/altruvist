import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
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
      return json(
        {
          error: [
            { path: ["charityId"], message: "Charity selection is required" },
          ],
        },
        { status: 400 },
      );
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
      return json(
        {
          error: [
            {
              path: ["charityId"],
              message:
                "You do not have permission to create tasks for this charity",
            },
          ],
        },
        { status: 403 },
      );
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
    });

    console.log("Validated Task Data", validatedData);

    // Use the charity ID from the form data instead of userInfo.charityId
    const task = await createTask(validatedData, charityId, userInfo.id);
    console.log("New task created", task);

    return json({ error: null }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log(err.errors);

      return json({ error: err.errors }, { status: 400 });
    }
    throw err;
  }
}
