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

  const { userInfo, error } = await getUserInfo(accessToken);
  if (!userInfo?.charityId || !userInfo.id) {
    console.log(error);
    return redirect("/zitlogin");
  }

  try {
    const newTask = JSON.parse(data.get("formData") as string);
    console.log("New Task Data", newTask);

    const validatedData = TaskSchema.parse({
      ...newTask,
      deadline: newTask.deadline,
      location: {
        address: newTask.location.address,
        lat: newTask.location.lat,
        lng: newTask.location.lng,
      },
      resources: (
        newTask.resources as unknown as UppyFile<Meta, Record<string, never>>[]
      ).map((upload) => ({
        name: upload.name || null,
        extension: upload.extension || null,
        type: upload.type || null,
        size: upload.size || null,
        uploadURL: upload.uploadURL || null,
      })),
    });

    console.log("Validated Task Data", validatedData);

    const task = await createTask(
      validatedData,
      userInfo.charityId,
      userInfo.id,
    );
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
