import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { getUserInfo } from "~/models/user2.server";
import { prisma } from "~/services/db.server";
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
  console.log(userId, taskId);

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
