import { ActionFunctionArgs, redirect } from "react-router";
import { getUserInfo } from "~/models/user2.server";
import { prisma } from "~/services/db.server";
import {
  addNovuSubscriberToTopic,
  triggerNotification,
} from "~/services/novu.server";
import { getSession } from "~/services/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const taskId = formData.get("taskId") as string;
  const charityId = formData.get("charityId") as string;
  const session = await getSession(request);
  const accessToken = session.get("accessToken"); //retrieve access token from session to be used as bearer token

  if (!accessToken) {
    return redirect("/zitlogin");
  }
  const { userInfo } = await getUserInfo(accessToken);
  if (!userInfo?.id) {
    return redirect("/zitlogin");
  }
  const userId = userInfo.id;

  try {
    if (!taskId || !charityId) {
      return { success: false, message: "Missing taskId or charityId" };
    }
    if (!userId) {
      return { createApplication: null, error: true, message: "User not found" }
    }

    const existingApplication = await prisma.taskApplications.findFirst({
      where: { userId, taskId },
    });

    if (existingApplication) {
      return {
        createApplication: null,
        error: true,
        message: "User has already applied for this task",
      }
    }
    const createApplication = await prisma.taskApplications.create({
      data: { status: "PENDING", userId, taskId, charityId },
    });

    console.log("Application created:", createApplication);

    const task = await prisma.tasks.findUnique({ where: { id: taskId } });
    await addNovuSubscriberToTopic(
      [userId],
      task?.notifyTopicId.find((item) => item.includes("volunteers")) ?? "",
    );

    await triggerNotification({
      userInfo,
      workflowId: "applications-feed",
      notification: {
        subject: "Task Application",
        body: `${userInfo?.name} has applied to the task ${task?.title}`,
        type: "application",
        applicationId: createApplication.id,
        taskId: task?.id,
      },
      type: "Topic",
      topicKey: task?.notifyTopicId.find((item) => item.includes("charities")),
    });

    return {
        createApplication,
        error: false,
        message: "Application submitted successfully",
      };
  } catch (error) {
    console.error("Failed to apply for task:", error);
    return { success: false, error: "Failed to apply for task" };
  }
}
