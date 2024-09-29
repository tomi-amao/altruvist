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
    return redirect("/login");
  }
  const { userInfo, error } = await getUserInfo(accessToken);
  if (!userInfo?.id) {
    return redirect("login");
  }
  const userId = userInfo.id;
  console.log(userId, taskId);

  try {
    const createApplication = await prisma.taskApplications.create({
      data: { status: "PENDING", userId, taskId, charityId },
    });

    return json({ success: true, createApplication });
  } catch (error) {
    console.error("Failed to apply for task:", error);
    return json(
      { success: false, error: "Failed to apply for task" },
      { status: 500 },
    );
  }
}
