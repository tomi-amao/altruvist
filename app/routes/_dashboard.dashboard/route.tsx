import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { differenceInDays } from "date-fns";
import DashboardBanner from "~/components/cards/BannerSummaryCard";
import { getUserTasks, getAllTasks } from "~/models/tasks.server";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import { Section } from "~/components/cards/DashboardSection";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const isNew = session.get("isNew");

  if (!accessToken) {
    return redirect("/zitlogin");
  }

  const { userInfo } = await getUserInfo(accessToken);
  if (!userInfo) {
    return redirect("/zitlogin");
  }

  if (isNew) {
    return redirect("/newuser");
  }

  const userRole = userInfo.roles[0];
  const { tasks } = await getUserTasks(
    userRole,
    undefined,
    userInfo.id,
    undefined,
    undefined,
    undefined,
    undefined,
    10,
  );
  const { allTasks } = await getAllTasks({ skip: 0, take: 1000000 }); // Get all available tasks

  // Enhanced deadline filtering with sorting
  const nearingDeadlineTasks = tasks
    .filter((task) => {
      const deadline = new Date(task.deadline);
      const now = new Date();
      const diffDays = differenceInDays(deadline, now);
      return diffDays >= 0 && diffDays <= 7; // Only include future deadlines within 7 days
    })
    .filter((task) => task.status !== "COMPLETED")
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    );

  const notStartedTasks = tasks.filter((task) => task.status === "NOT_STARTED");
  const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((task) => task.status === "COMPLETED");

  // Calculate statistics for banner
  let recommendedTask = "";
  let charitiesHelped = 0;

  if (userRole === "volunteer") {
    // Calculate skill match score for each task
    // Exclude tasks that the volunteer has already applied to
    const taskMatchScores = allTasks
      .filter(
        (task) =>
          task.status === "NOT_STARTED" &&
          task.taskApplications?.every((app) => app.userId !== userInfo.id),
      )
      .map((task) => {
        const matchingSkills = task.requiredSkills.filter((skill) =>
          userInfo.skills.includes(skill),
        );
        return {
          task,
          matchScore: matchingSkills.length,
          urgencyBonus:
            task.urgency === "HIGH" ? 2 : task.urgency === "MEDIUM" ? 1 : 0,
        };
      })
      .filter(({ matchScore }) => matchScore > 0) // Only consider tasks with at least one matching skill
      .sort(
        (a, b) =>
          // Sort by match score first, then urgency as a tiebreaker
          b.matchScore + b.urgencyBonus - (a.matchScore + a.urgencyBonus),
      );

    recommendedTask =
      taskMatchScores[0]?.task.title || "No matching tasks found";

    // Count unique charities the volunteer has helped
    const uniqueCharities = new Set(
      completedTasks
        .filter((task) =>
          task.taskApplications?.some(
            (app) => app.userId === userInfo.id && app.status === "ACCEPTED",
          ),
        )
        .map((task) => task.charityId),
    );
    charitiesHelped = uniqueCharities.size;
  } else {
    // For charities, show the task with most applications
    const popularTask = [...tasks].sort(
      (a, b) =>
        (b.taskApplications?.length || 0) - (a.taskApplications?.length || 0),
    )[0];
    recommendedTask = popularTask?.title || "No active tasks";

    // For charities, show number of volunteers helped
    const uniqueVolunteers = new Set(
      completedTasks.flatMap(
        (task) =>
          task.taskApplications
            ?.filter((app) => app.status === "ACCEPTED")
            .map((app) => app.userId) || [],
      ),
    );
    charitiesHelped = uniqueVolunteers.size;
  }

  return {
    userRole,
    nearingDeadlineTasks,
    notStartedTasks,
    inProgressTasks,
    completedTasks,
    recommendedTask,
    charitiesHelped,
    tasks,
  };
}

export default function DashboardHome() {
  const {
    userRole,
    nearingDeadlineTasks,
    notStartedTasks,
    inProgressTasks,
    completedTasks,
    recommendedTask,
    charitiesHelped,
    tasks,
  } = useLoaderData<typeof loader>();

  const bannerItems = [
    {
      title:
        userRole === "volunteer" ? "Recommended Task" : "Most Popular Task",
      value: recommendedTask,
    },
    {
      title:
        userRole === "volunteer" ? "Charities Helped" : "Volunteers Helped",
      value: charitiesHelped.toString(),
    },
  ];

  const sectionsData = [
    {
      title: "Tasks Nearing Deadline",
      tasks:
        userRole === "charity"
          ? nearingDeadlineTasks
          : nearingDeadlineTasks.filter(
              (task) => task.taskApplications[0]?.status === "ACCEPTED",
            ),
    },
    userRole === "charity"
      ? {
          title: "Not Started Tasks",
          tasks: notStartedTasks,
        }
      : {
          title: "Task Applications",
          tasks: tasks,
        },
    {
      title: "In Progress Tasks",
      tasks:
        userRole === "charity"
          ? inProgressTasks
          : inProgressTasks.filter(
              (task) => task.taskApplications[0]?.status === "ACCEPTED",
            ),
    },
    {
      title: "Completed Tasks",
      tasks:
        userRole === "charity"
          ? completedTasks
          : completedTasks.filter(
              (task) => task.taskApplications[0]?.status === "ACCEPTED",
            ),
    },
  ];

  return (
    <div className="min-h-screen bg-basePrimary">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <DashboardBanner
            date={new Date().toDateString()}
            bannerItems={bannerItems}
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectionsData.map((section, index) => (
            <Section
              key={index}
              title={section.title}
              tasks={section.tasks}
              userRole={userRole}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
