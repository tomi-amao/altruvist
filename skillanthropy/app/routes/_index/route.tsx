import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ErrorPopup from "~/components/cards/ErrorPopup";
import PopularTasks from "~/components/cards/LatestTasksCard";
import Navbar from "~/components/navigation/Header2";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import { prisma } from "~/services/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Skillanthropy" },
    { name: "description", content: "Welcome to Skillanthropy!" },
  ];
};

export default function Index() {
  const { userInfo, error, recentTasks } = useLoaderData<typeof loader>();
  console.log(userInfo?.id);

  return (
    <>
      <div className="bg-baseSecondary h-auto lg:h-screen max-w-full">
        <Navbar altBackground={true} userId={userInfo?.id} />
        <div className="p-4"></div>
        <h1 className="tracking-wide text-accentPrimary w-fit text-4xl lg:text-7xl mt-8 m-auto">
          Donate your digital skills
        </h1>
        {error && <ErrorPopup error={error} />}
        <h1 className="tracking-wide text-basePrimaryDark w-fit text-3xl m-auto lg:text-5xl ">
          Amplify Charity Impact
        </h1>
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-center gap-8 py-8">
          <div className="w-full lg:w-1/2 max-w-2xl">
            <img
              src="/watering_plant.png"
              alt="water plant home page"
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="w-full lg:w-1/2 max-w-2xl">
            <PopularTasks tasks={recentTasks} />
          </div>
        </div>
      </div>
    </>
  );
}

import { subDays } from "date-fns";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  // Get the date 30 days ago for recency filtering
  const thirtyDaysAgo = subDays(new Date(), 30);

  // Fetch tasks with popularity metrics
  const recentTasks = await prisma.tasks.findMany({
    take: 3,
    where: {
      OR: [{ urgency: "HIGH" }, { createdAt: { gte: thirtyDaysAgo } }],
    },
    include: {
      charity: { select: { name: true } },
      taskApplications: { select: { id: true } },
      _count: { select: { taskApplications: true } },
    },
    orderBy: [{ taskApplications: { _count: "desc" } }, { createdAt: "desc" }],
  });

  // Calculate popularity score for each task
  const tasksWithScore = recentTasks.map((task) => ({
    ...task,
    popularityScore: calculatePopularityScore(task),
  }));

  // Get top 3 tasks sorted by popularity score
  const topTasks = tasksWithScore
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 3);

  // Check for authentication errors
  const urlError = new URL(request.url).searchParams.get("error");
  console.log("error", urlError);

  if (urlError) {
    return {
      message: "Authentication Error",
      userInfo: null,
      error: urlError,
      recentTasks: topTasks,
    };
  }

  if (!accessToken) {
    return {
      message: "User not logged in",
      userInfo: null,
      error: null,
      recentTasks: topTasks,
    };
  }

  const { userInfo } = await getUserInfo(accessToken);
  return { userInfo, error: null, recentTasks: topTasks };
}

// Helper function to calculate task popularity score
function calculatePopularityScore(task: {
  createdAt: Date;
  urgency: string;
  _count: { taskApplications: number };
}) {
  const recencyScore = calculateRecencyScore(task.createdAt);
  const applicationScore = task._count.taskApplications * 2;
  const urgencyScores = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  return recencyScore + applicationScore + (urgencyScores[task.urgency] || 1);
}

// Helper function to calculate recency score
function calculateRecencyScore(createdAt: Date): number {
  const ageInDays = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  return ageInDays <= 7 ? 5 : ageInDays <= 14 ? 3 : ageInDays <= 30 ? 1 : 0;
}
