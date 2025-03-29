import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { getUserInfo } from "~/models/user2.server";
import { prisma } from "~/services/db.server";
import { addNovuSubscriberToTopic, triggerNotification } from "~/services/novu.server";
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
      return json(
        { success: false, message: "Missing taskId or charityId" },
        { status: 400 },
      );
    }
    if (!userId) {
      return json(
        { createApplication: null, error: true, message: "User not found" },
        { status: 404 },
      );
    }

    const existingApplication = await prisma.taskApplications.findFirst({
      where: { userId, taskId },
    });

    if (existingApplication) {
      return json(
        {
          createApplication: null,
          error: true,
          message: "User has already applied for this task",
        },
        { status: 400 },
      );
    }
    const createApplication = await prisma.taskApplications.create({
      data: { status: "PENDING", userId, taskId, charityId },
    });

    console.log("Application created:", createApplication);
    

    
    const task = await prisma.tasks.findUnique({ where: { id: taskId } });
    await addNovuSubscriberToTopic([userId], task?.notifyTopicId.find(item => item.includes("volunteers")) ?? "");
    
    const notificationResult = await triggerNotification({
      userInfo,
      workflowId: "applications-feed",
      notification: {
        subject: "New Task Application",
        body: `${userInfo?.name} has applied to the task ${task?.title}`,
        type: "application",
        taskApplicationId: createApplication.id,
        taskId: task?.id,
      },
      type: "Topic",
      topicKey: task?.notifyTopicId.find(item => item.includes("charities"))
    });
    

    return json(
      {
        createApplication,
        error: false,
        message: "Application submitted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to apply for task:", error);
    return json(
      { success: false, error: "Failed to apply for task" },
      { status: 500 },
    );
  }
}
