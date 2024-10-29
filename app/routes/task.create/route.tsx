import { tasks } from "@prisma/client";
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Meta, UppyFile } from "@uppy/core";
import { createTask } from "~/models/tasks.server";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";

export async function loader() {
  return redirect("/dashboard/tasks");
}

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.formData();
  const session = await getSession(request);
  const accessToken = session.get("accessToken"); //retrieve access token from session to be used as bearer token

  if (!accessToken) {
    return redirect("/login");
  }
  const { userInfo, error } = await getUserInfo(accessToken);
  if (!userInfo?.charityId || !userInfo.id) {
    console.log(error);

    return redirect("/login");
  }

  const newTask: Partial<tasks> = JSON.parse(data.get("formData") as string);
  console.log("Task data submitted", newTask);

  const rawResources = newTask.resources as unknown as UppyFile<
    Meta,
    Record<string, never>
  >[];
  const resources = rawResources.map((upload) => {
    return {
      name: upload.name || null,
      extension: upload.extension || null,
      type: upload.type || null,
      size: upload.size || null,
      uploadURL: upload.uploadURL || null,
    };
  });

  const taskData: Partial<tasks> = {
    title: newTask.title,
    category: newTask.category,
    impact: newTask.impact,
    deadline: new Date(newTask.deadline as Date),
    urgency: newTask.urgency,
    deliverables: newTask.deliverables,
    description: newTask.description,
    volunteersNeeded: newTask.volunteersNeeded,
    resources: resources,
    requiredSkills: newTask.requiredSkills,
  };
  const task = await createTask(taskData, userInfo.charityId, userInfo?.id);
  console.log("New task created", task);

  return redirect("/dashboard/tasks");
}
