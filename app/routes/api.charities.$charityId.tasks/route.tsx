import { LoaderFunctionArgs } from "react-router";
import { getTasksByCharityId } from "~/models/tasks.server";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import { getCharity } from "~/models/charities.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { charityId } = params;

  if (!charityId) {
    return { error: "Charity ID is required", tasks: [] };
  }

  try {
    // Get authenticated user info to check permissions if needed
    const session = await getSession(request);
    const accessToken = session.get("accessToken");

    let userInfo = null;
    if (accessToken) {
      const { userInfo: user } = await getUserInfo(accessToken);
      userInfo = user;
    }

    // Get charity info for the charity name
    const { charity } = await getCharity(charityId);
    const charityName = charity?.name || "";

    // Get tasks for the charity
    const { tasks, error, status } = await getTasksByCharityId(charityId);

    if (error) {
      return { error, tasks: [] };
    }

    // Transform tasks to include required properties for TaskCard
    const transformedTasks =
      tasks?.map((task) => {
        return {
          ...task,
          charityName,
          userName: task.createdBy?.name || "",
          userRole: userInfo?.roles || [],
          volunteerDetails: {
            userId: userInfo?.id || "",
            taskApplications: [],
          },
        };
      }) || [];

    console.log("Transformed tasks:", transformedTasks);

    return { tasks: transformedTasks };
  } catch (error) {
    console.error("Error fetching charity tasks:", error);
    return { error: "Failed to fetch charity tasks", tasks: [] };
  }
}
