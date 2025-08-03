import { LoaderFunctionArgs, redirect } from "react-router";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import { getUserTasks } from "~/models/tasks.server";
import { getCompanionVars } from "~/services/env.server";
import { TaskStatus } from "@prisma/client";
import { SortOrder } from "../_app.search/route";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  if (!accessToken) {
    return redirect("/zitlogin");
  }
  const { userInfo, charityMemberships } = await getUserInfo(accessToken);
  if (!userInfo?.id) {
    return redirect("/zitlogin");
  }

  const companionVars = getCompanionVars();
  const { id: userId, roles: userRole, charityId, name } = userInfo;

  // Extract user's charities from charity memberships for the dropdown
  const userCharities =
    charityMemberships?.memberships
      ?.filter((membership) =>
        membership.roles.some((role) => ["admin", "editor"].includes(role)),
      )
      .map((membership) => ({
        id: membership.charity.id,
        name: membership.charity.name,
      })) || [];

  const url = new URL(request.url);
  const deadline = url.searchParams.get("deadline");
  const createdAt = url.searchParams.get("createdAt");
  const updatedAt = url.searchParams.get("updatedAt");
  const taskStatus = url.searchParams.get("status");

  try {
    const { tasks, error, message, status } = await getUserTasks(
      userRole[0],
      taskStatus as TaskStatus,
      userId,
      charityId || undefined,
      deadline as SortOrder,
      createdAt as SortOrder,
      updatedAt as SortOrder,
    );

    if (error) {
      throw new Response(message || "Error loading tasks", {
        status: status || 500,
      });
    }

    return {
      tasks,
      userRole,
      userId,
      error: null,
      isLoading: false,
      userName: name,
      uploadURL: companionVars.COMPANION_URL,
      GCPKey: process.env.GOOGLE_MAPS_API_KEY,
      userCharities, // Add userCharities to the response
    };
  } catch (error) {
    return {
      tasks: [],
      userRole,
      userId,
      error: error.message,
      isLoading: false,
      userName: null,
      uploadURL: null,
      userCharities: [], // Include empty userCharities array
    };
  }
}
