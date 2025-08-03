import {
  LoaderFunctionArgs,
  redirect,
  MetaFunction,
  useLoaderData,
  Link,
} from "react-router";
import { differenceInDays } from "date-fns";
import { getUserTasks, getAllTasks } from "~/models/tasks.server";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import { motion } from "framer-motion";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "~/components/ui/chart";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Clock,
  CheckCircle,
  Play,
  Users,
  Target,
  TrendUp,
  Calendar,
  Heart,
  Trophy,
  Activity,
  ArrowRight,
  Sparkle,
  Briefcase,
  HandWaving,
} from "@phosphor-icons/react";
import type {
  tasks,
  taskApplications,
  ApplicationStatus,
} from "@prisma/client";

// Extended task type that includes taskApplications relation
interface TaskWithApplications extends tasks {
  taskApplications?: (
    | taskApplications
    | { id: string; userId: string; status: ApplicationStatus }
  )[];
}

export const meta: MetaFunction = () => {
  return [
    {
      title: "Dashboard | Altruvist",
      description: "Manage your tasks on your dashboard",
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  if (!accessToken) {
    return redirect("/zitlogin");
  }

  const { userInfo } = await getUserInfo(accessToken);
  if (!userInfo) {
    return redirect("/zitlogin");
  }

  const userRole = userInfo.roles[0];
  const { tasks: rawTasks = [] } = await getUserTasks(
    userRole,
    undefined,
    userInfo.id,
    undefined,
    undefined,
    undefined,
    undefined,
    10,
  );
  const { allTasks: rawAllTasks = [] } = await getAllTasks({
    skip: 0,
    take: 1000000,
  });

  // Ensure tasks is properly typed and includes taskApplications
  const tasks: TaskWithApplications[] = Array.isArray(rawTasks) ? rawTasks : [];
  const allTasks: TaskWithApplications[] = Array.isArray(rawAllTasks)
    ? rawAllTasks
    : [];

  const nearingDeadlineTasks = tasks
    .filter((task): task is TaskWithApplications => {
      if (!task || !task.deadline) return false;
      const deadline = new Date(task.deadline);
      const now = new Date();
      const diffDays = differenceInDays(deadline, now);
      return diffDays >= 0 && diffDays <= 7;
    })
    .filter((task) => task?.status !== "COMPLETED")
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    );

  const notStartedTasks = tasks.filter(
    (task): task is TaskWithApplications => task?.status === "NOT_STARTED",
  );
  const inProgressTasks = tasks.filter(
    (task): task is TaskWithApplications => task?.status === "IN_PROGRESS",
  );
  const completedTasks = tasks.filter(
    (task): task is TaskWithApplications => task?.status === "COMPLETED",
  );

  let recommendedTask = "";
  let charitiesHelped = 0;

  if (userRole === "volunteer") {
    const taskMatchScores = allTasks
      .filter(
        (task): task is TaskWithApplications =>
          task?.status === "NOT_STARTED" &&
          (task?.taskApplications?.every(
            (app) => app?.userId !== userInfo.id,
          ) ??
            true),
      )
      .map((task) => {
        const matchingSkills =
          task?.requiredSkills?.filter((skill) =>
            userInfo?.skills?.includes(skill),
          ) || [];
        return {
          task,
          matchScore: matchingSkills.length,
          urgencyBonus:
            task?.urgency === "HIGH" ? 2 : task?.urgency === "MEDIUM" ? 1 : 0,
        };
      })
      .filter(({ matchScore }) => matchScore > 0)
      .sort(
        (a, b) =>
          b.matchScore + b.urgencyBonus - (a.matchScore + a.urgencyBonus),
      );

    recommendedTask =
      taskMatchScores[0]?.task?.title || "No matching tasks found";

    const uniqueCharities = new Set(
      completedTasks
        .filter((task) =>
          task.taskApplications?.some(
            (app) => app?.userId === userInfo.id && app?.status === "ACCEPTED",
          ),
        )
        .map((task) => task.charityId),
    );
    charitiesHelped = uniqueCharities.size;
  } else {
    const popularTask = [...tasks].sort(
      (a, b) =>
        (b.taskApplications?.length || 0) - (a.taskApplications?.length || 0),
    )[0];
    recommendedTask = popularTask?.title || "No active tasks";

    const uniqueVolunteers = new Set(
      completedTasks.flatMap(
        (task) =>
          task.taskApplications
            ?.filter((app) => app?.status === "ACCEPTED")
            .map((app) => app?.userId) || [],
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
    userInfo,
  };
}

// Chart configurations
const taskStatusConfig = {
  acceptedTasks: {
    label: "Accepted Tasks",
    color: "hsl(24, 95%, 53%)",
  },
  completed: {
    label: "Completed",
    color: "hsl(142, 76%, 36%)",
  },
  nearDeadline: {
    label: "Near Deadline",
    color: "hsl(0, 84%, 60%)",
  },
  notStarted: {
    label: "Not Started",
    color: "hsl(45, 93%, 47%)",
  },
  inProgress: {
    label: "In Progress",
    color: "hsl(24, 95%, 53%)",
  },
} satisfies ChartConfig;

const urgencyConfig = {
  high: {
    label: "High Priority",
    color: "hsl(0, 84%, 60%)",
  },
  medium: {
    label: "Medium Priority",
    color: "hsl(45, 93%, 47%)",
  },
  low: {
    label: "Low Priority",
    color: "hsl(142, 76%, 36%)",
  },
};

// Task Card Component
const TaskCard = ({
  task,
  userRole,
  className = "",
}: {
  task: TaskWithApplications;
  userRole: string;
  className?: string;
}) => {
  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "NOT_STARTED":
        return <Play size={16} className="text-yellow-600" />;
      case "IN_PROGRESS":
        return <Clock size={16} className="text-orange-600" />;
      case "COMPLETED":
        return <CheckCircle size={16} className="text-green-600" />;
      default:
        return <Activity size={16} className="text-gray-600" />;
    }
  };

  const daysUntilDeadline = task.deadline
    ? differenceInDays(new Date(task.deadline), new Date())
    : null;

  return (
    <Link to={`tasks/?taskid=${task.id}`} className={`block ${className}`}>
      <motion.div
        className="bg-white rounded-lg p-4 border border-gray-200 hover:border-accentPrimary hover:shadow-md transition-all cursor-pointer"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-baseSecondary text-sm line-clamp-2 flex-1">
            {task.title}
          </h4>
          <div className="flex items-center gap-1 ml-2">
            {getStatusIcon(task.status)}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-baseSecondary/70 mb-2">
          <span
            className={`px-2 py-1 rounded-full border text-xs ${getUrgencyColor(task.urgency)}`}
          >
            {task.urgency}
          </span>
          {daysUntilDeadline !== null && (
            <span
              className={`px-2 py-1 rounded ${
                daysUntilDeadline <= 3
                  ? "bg-red-100 text-red-700"
                  : daysUntilDeadline <= 7
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {daysUntilDeadline === 0
                ? "Due today"
                : daysUntilDeadline === 1
                  ? "1 day left"
                  : `${daysUntilDeadline} days left`}
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-baseSecondary/60 line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-baseSecondary/50">
            {userRole === "charity"
              ? `${task.taskApplications?.length || 0} applications`
              : "Click to view"}
          </span>
          <ArrowRight size={14} className="text-baseSecondary" />
        </div>
      </motion.div>
    </Link>
  );
};

// Volunteer Dashboard Component
const VolunteerDashboard = ({
  data,
}: {
  data: Awaited<ReturnType<typeof loader>>;
}) => {
  if (data instanceof Response) {
    return null;
  }
  const {
    nearingDeadlineTasks,
    inProgressTasks,
    completedTasks,
    recommendedTask,
    charitiesHelped,
    tasks,
    userInfo,
  } = data;

  // Prepare chart data with correct structure
  const taskStatusData = [
    {
      category: "acceptedTasks",
      tasks: inProgressTasks.filter((task) =>
        task.taskApplications?.some((app) => app.status === "ACCEPTED"),
      ).length,
      fill: "var(--color-acceptedTasks)",
    },
    {
      category: "completed",
      tasks: completedTasks.filter((task) =>
        task.taskApplications?.some((app) => app.status === "ACCEPTED"),
      ).length,
      fill: "var(--color-completed)",
    },
    {
      category: "nearDeadline",
      tasks: nearingDeadlineTasks.length,
      fill: "var(--color-nearDeadline)",
    },
  ];

  // Generate real monthly progress data from completed tasks
  const generateMonthlyProgressData = () => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();
    const monthlyData = [];

    // Get last 6 months including current month
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const monthName = monthNames[targetDate.getMonth()];
      const year = targetDate.getFullYear();

      // Filter completed tasks for this month that the volunteer was involved in
      const tasksThisMonth = completedTasks.filter((task) => {
        if (!task.updatedAt || task.status !== "COMPLETED") return false;

        const completedDate = new Date(task.updatedAt);
        const isVolunteerTask = task.taskApplications?.some(
          (app) => app.userId === userInfo.id && app.status === "ACCEPTED",
        );

        return (
          isVolunteerTask &&
          completedDate.getMonth() === targetDate.getMonth() &&
          completedDate.getFullYear() === year
        );
      });

      // Calculate estimated hours (assuming 4 hours per task on average)
      const estimatedHours = tasksThisMonth.length * 4;

      // Count unique charities helped this month
      const charitiesThisMonth = new Set(
        tasksThisMonth.map((task) => task.charityId),
      ).size;

      monthlyData.push({
        month: monthName,
        completed: tasksThisMonth.length,
        hours: estimatedHours,
        charities: charitiesThisMonth,
      });
    }

    return monthlyData;
  };

  // Generate token earnings data from completed tasks
  const generateTokenEarningsData = () => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();
    const monthlyData = [];

    // Get last 6 months including current month
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const monthName = monthNames[targetDate.getMonth()];
      const year = targetDate.getFullYear();

      // Filter completed tasks for this month that the volunteer was involved in and had token rewards
      const tasksWithTokensThisMonth = completedTasks.filter((task) => {
        if (
          !task.updatedAt ||
          task.status !== "COMPLETED" ||
          !task.rewardAmount
        )
          return false;

        const completedDate = new Date(task.updatedAt);
        const isVolunteerTask = task.taskApplications?.some(
          (app) => app.userId === userInfo.id && app.status === "ACCEPTED",
        );

        return (
          isVolunteerTask &&
          completedDate.getMonth() === targetDate.getMonth() &&
          completedDate.getFullYear() === year
        );
      });

      // Calculate total tokens earned this month (accounting for reward splitting)
      const tokensEarned = tasksWithTokensThisMonth.reduce((total, task) => {
        // Count how many volunteers were accepted for this task
        const acceptedVolunteers =
          task.taskApplications?.filter((app) => app.status === "ACCEPTED")
            .length || 1; // Default to 1 if no applications found to avoid division by zero

        // Calculate this volunteer's share of the reward (split evenly among all accepted volunteers)
        const volunteerShare = (task.rewardAmount || 0) / acceptedVolunteers;

        return total + volunteerShare;
      }, 0);

      // Calculate cumulative tokens earned up to this month
      const cumulativeTokens =
        monthlyData.reduce((sum, monthData) => sum + monthData.earned, 0) +
        tokensEarned;

      monthlyData.push({
        month: monthName,
        earned: Math.round(tokensEarned * 100) / 100, // Round to 2 decimal places
        cumulative: Math.round(cumulativeTokens * 100) / 100, // Round to 2 decimal places
        tasksCount: tasksWithTokensThisMonth.length,
      });
    }

    return monthlyData;
  };

  const monthlyProgressData = generateMonthlyProgressData();
  const tokenEarningsData = generateTokenEarningsData();

  // For volunteers, active tasks should only be tasks in IN_PROGRESS state
  const activeInProgressTasks = tasks.filter(
    (task) =>
      task.status === "IN_PROGRESS" &&
      task.taskApplications?.some(
        (app) => app.userId === userInfo.id && app.status === "ACCEPTED",
      ),
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        className="bg-baseSecondary rounded-xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div>
            <p className="text-white/90 font-bold lg:text-5xl text-2xl mb-2 flex items-center">
              Welcome Back{" "}
              <span>
                {" "}
                <HandWaving size={40} weight="duotone" />
              </span>
            </p>
            <p className="text-white/90">Ready to make a difference today?</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={20} />
              <span className="text-sm">Charities Helped</span>
            </div>
            <p className="text-2xl font-bold">{charitiesHelped}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={20} />
              <span className="text-sm">Tasks Completed</span>
            </div>
            <p className="text-2xl font-bold">{completedTasks.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkle size={20} />
              <span className="text-sm">Recommended</span>
            </div>
            <p className="text-sm font-medium truncate">{recommendedTask}</p>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Donut Chart */}
        <motion.div
          className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-base sm:text-lg font-bold text-baseSecondary mb-3 sm:mb-4 flex items-center gap-2">
            <Target size={18} className="text-baseSecondary` sm:w-5 sm:h-5" />
            Task Overview
          </h3>
          <div className="w-full h-[200px] sm:h-[250px]">
            <ChartContainer config={taskStatusConfig} className="w-full h-full">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="category" />}
                />
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="75%"
                  dataKey="tasks"
                  animationBegin={0}
                  animationDuration={1000}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="category" />}
                  className=""
                />
              </PieChart>
            </ChartContainer>
          </div>
        </motion.div>

        {/* Tasks by Month Chart */}
        <motion.div
          className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-base sm:text-lg font-bold text-baseSecondary mb-3 sm:mb-4 flex items-center gap-2">
            <div className="flex items-center gap-2 lg:mb-11">
              <TrendUp size={18} className="text-baseSecondary sm:w-5 sm:h-5" />
              <span>Monthly Task Completion</span>
            </div>
          </h3>
          <div className="w-full h-[200px] sm:h-[250px] overflow-hidden">
            <ChartContainer
              config={{
                completed: {
                  label: "Tasks Completed",
                  color: "hsl(142, 76%, 36%)",
                },
                hours: { label: "Estimated Hours", color: "hsl(24, 95%, 53%)" },
                charities: {
                  label: "Charities Helped",
                  color: "hsl(262, 83%, 58%)",
                },
              }}
              className="w-full h-full"
            >
              <AreaChart
                data={monthlyProgressData}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-semibold text-sm">{label}</p>
                          <div className="space-y-1 text-xs">
                            <p className="flex items-center gap-2">
                              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                              Tasks: {data.completed}
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                              Est. Hours: {data.hours}
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                              Charities: {data.charities}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(142, 76%, 36%)"
                  fill="hsl(142, 76%, 36%)"
                  fillOpacity={0.6}
                  animationDuration={1500}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </motion.div>

        {/* Token Earnings Chart */}
        <motion.div
          className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-base sm:text-lg font-bold text-baseSecondary mb-3 sm:mb-4 flex items-center gap-2">
            <div className="flex items-center gap-2 lg:mb-11">
              <TrendUp size={18} className="text-baseSecondary sm:w-5 sm:h-5" />
              <span>Token Earnings</span>
            </div>
          </h3>
          <div className="w-full h-[200px] sm:h-[250px] overflow-hidden">
            <ChartContainer
              config={{
                earned: { label: "Tokens Earned", color: "hsl(45, 93%, 47%)" },
                cumulative: {
                  label: "Total Tokens",
                  color: "hsl(142, 76%, 36%)",
                },
              }}
              className="w-full h-full"
            >
              <LineChart
                data={tokenEarningsData}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-semibold text-sm">{label}</p>
                          <div className="space-y-1 text-xs">
                            <p className="flex items-center gap-2">
                              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                              Earned: {data.earned} ALTR
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                              Total: {data.cumulative} ALTR
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                              Tasks: {data.tasksCount}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="earned"
                  stroke="hsl(45, 93%, 47%)"
                  strokeWidth={2}
                  animationDuration={1500}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  animationDuration={1500}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </motion.div>
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tasks - Only IN_PROGRESS tasks */}
        <motion.div
          className="bg-white rounded-xl p-6 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-lg font-bold text-baseSecondary mb-4 flex items-center gap-2">
            <Activity size={20} className="text-amber-700" />
            Active Tasks ({activeInProgressTasks.length})
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activeInProgressTasks.length > 0 ? (
              activeInProgressTasks
                .slice(0, 5)
                .map((task) => (
                  <TaskCard key={task.id} task={task} userRole="volunteer" />
                ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                <p>No active tasks yet</p>
                <p className="text-sm">Apply for tasks to get started!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Urgent Tasks */}
        <motion.div
          className="bg-white rounded-xl p-6 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h3 className="text-lg font-bold text-baseSecondary mb-4 flex items-center gap-2">
            <Clock size={20} className="text-red-500" />
            Nearing Deadline ({nearingDeadlineTasks.length})
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {nearingDeadlineTasks.length > 0 ? (
              nearingDeadlineTasks
                .slice(0, 5)
                .map((task) => (
                  <TaskCard key={task.id} task={task} userRole="volunteer" />
                ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p>No urgent deadlines</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Charity Dashboard Component
const CharityDashboard = ({
  data,
}: {
  data: Awaited<ReturnType<typeof loader>>;
}) => {
  if (data instanceof Response) {
    return null;
  }

  const {
    nearingDeadlineTasks,
    notStartedTasks,
    inProgressTasks,
    completedTasks,
    charitiesHelped,
    tasks,
  } = data;

  // Generate real application trends data from last 6 months
  const generateApplicationTrends = () => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const monthName = monthNames[targetDate.getMonth()];
      const monthStart = new Date(targetDate);
      const monthEnd = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
      );

      // Count applications for this month across all charity tasks
      const applicationsThisMonth = tasks.reduce((count, task) => {
        const taskApplications = task.taskApplications || [];
        const monthApplications = taskApplications.filter((app) => {
          if (!app.createdAt) return false;
          const appDate = new Date(app.createdAt);
          return appDate >= monthStart && appDate <= monthEnd;
        });
        return count + monthApplications.length;
      }, 0);

      monthlyData.push({
        month: monthName,
        applications: applicationsThisMonth,
      });
    }

    return monthlyData;
  };

  // Prepare chart data
  const taskStatusData = [
    {
      category: "notStarted",
      tasks: notStartedTasks.length,
      fill: "var(--color-notStarted)",
    },
    {
      category: "inProgress",
      tasks: inProgressTasks.length,
      fill: "var(--color-inProgress)",
    },
    {
      category: "completed",
      tasks: completedTasks.length,
      fill: "var(--color-completed)",
    },
  ];

  const urgencyBreakdown = [
    {
      urgency: "High",
      count: tasks.filter(
        (task: TaskWithApplications) => task.urgency === "HIGH",
      ).length,
      fill: urgencyConfig.high.color,
    },
    {
      urgency: "Medium",
      count: tasks.filter(
        (task: TaskWithApplications) => task.urgency === "MEDIUM",
      ).length,
      fill: urgencyConfig.medium.color,
    },
    {
      urgency: "Low",
      count: tasks.filter(
        (task: TaskWithApplications) => task.urgency === "LOW",
      ).length,
      fill: urgencyConfig.low.color,
    },
  ];

  const applicationTrends = generateApplicationTrends();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        className="bg-baseSecondary rounded-xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div>
            <p className="text-white/90 font-bold lg:text-5xl text-2xl mb-2">
              Charity Dashboard
            </p>
            <p className="text-white/90">Manage your impact and volunteers</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} />
              <span className="text-sm">Volunteers</span>
            </div>
            <p className="text-2xl font-bold">{charitiesHelped}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={20} />
              <span className="text-sm">Total Tasks</span>
            </div>
            <p className="text-2xl font-bold">{tasks.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={20} />
              <span className="text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold">{completedTasks.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={20} />
              <span className="text-sm">Success Rate</span>
            </div>
            <p className="text-2xl font-bold">
              {tasks.length > 0
                ? Math.round((completedTasks.length / tasks.length) * 100)
                : 0}
              %
            </p>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Pie Chart */}
        <motion.div
          className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-base sm:text-lg font-bold text-baseSecondary mb-3 sm:mb-4 flex items-center gap-2">
            <Target size={18} className="text-baseSecondary sm:w-5 sm:h-5" />
            Task Status
          </h3>
          <div className="w-full h-[200px] sm:h-[250px] overflow-hidden">
            <ChartContainer config={taskStatusConfig} className="w-full h-full">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="category" />}
                />
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="75%"
                  dataKey="tasks"
                  animationBegin={0}
                  animationDuration={1000}
                ></Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="category" />}
                  className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </div>
        </motion.div>

        {/* Urgency Breakdown */}
        <motion.div
          className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-base sm:text-lg font-bold text-baseSecondary mb-3 sm:mb-4 flex items-center gap-2">
            <Activity size={18} className="text-baseSecondary sm:w-5 sm:h-5" />
            Priority Levels
          </h3>
          <div className="w-full h-[200px] sm:h-[250px] overflow-hidden">
            <ChartContainer config={urgencyConfig} className="w-full h-full">
              <BarChart
                data={urgencyBreakdown}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="urgency"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1200}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </motion.div>

        {/* Application Trends */}
        <motion.div
          className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-base sm:text-lg font-bold text-baseSecondary mb-3 sm:mb-4 flex items-center gap-2">
            <TrendUp size={18} className="text-baseSecondary sm:w-5 sm:h-5" />
            Applications
          </h3>
          <div className="w-full h-[200px] sm:h-[250px] overflow-hidden">
            <ChartContainer
              config={{
                applications: {
                  label: "Applications",
                  color: "hsl(262, 83%, 58%)",
                },
              }}
              className="w-full h-full"
            >
              <LineChart
                data={applicationTrends}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={2}
                  animationDuration={1500}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </motion.div>
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <motion.div
          className="bg-white rounded-xl p-6 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h3 className="text-lg font-bold text-baseSecondary mb-4 flex items-center gap-2">
            <Play size={20} className="text-yellow-500" />
            Pending Tasks ({notStartedTasks.length})
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {notStartedTasks.length > 0 ? (
              notStartedTasks
                .slice(0, 5)
                .map((task) => (
                  <TaskCard key={task.id} task={task} userRole="charity" />
                ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                <p>No pending tasks</p>
                <p className="text-sm">All tasks are active!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Urgent Deadlines */}
        <motion.div
          className="bg-white rounded-xl p-6 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3 className="text-lg font-bold text-baseSecondary mb-4 flex items-center gap-2">
            <Clock size={20} className="text-red-500" />
            Urgent Deadlines ({nearingDeadlineTasks.length})
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {nearingDeadlineTasks.length > 0 ? (
              nearingDeadlineTasks
                .slice(0, 5)
                .map((task) => (
                  <TaskCard key={task.id} task={task} userRole="charity" />
                ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p>No urgent deadlines</p>
                <p className="text-sm">Everything is on track!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function DashboardHome() {
  const data = useLoaderData<typeof loader>();
  const { userRole } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-basePrimary via-basePrimary to-basePrimaryLight -mt-20">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-16 sm:mt-20 max-w-7xl">
        {userRole === "volunteer" ? (
          <VolunteerDashboard data={data} />
        ) : (
          <CharityDashboard data={data} />
        )}
      </div>
    </div>
  );
}
