import { Link, useLocation } from "@remix-run/react";
import { LoadingIcon } from "../utils/icons";
import type { tasks } from "@prisma/client";

interface TaskListProps {
  tasks: (tasks & {
    taskApplications?: {
      id: string;
      status: string;
    }[];
  })[];
  isLoading: boolean;
  error?: string;
  onTaskSelect?: (task: tasks) => void;
  selectedTaskId?: string;
  userRole?: string;
}

export function TaskList({
  tasks = [], // Provide default empty array
  isLoading,
  error,
  onTaskSelect,
  selectedTaskId,
  userRole,
}: TaskListProps) {
  const location = useLocation();
  const isDashboardTasksRoute = location.pathname === "/dashboard/tasks";

  if (isLoading) return <LoadingIcon />;
  if (error) return <div>Error fetching tasks</div>;
  if (!tasks?.length) return <div>No tasks found</div>;

  const TaskItem = ({ task }: { task: TaskListProps["tasks"][0] }) => {
    const isSelected = task.id === selectedTaskId;
    const taskApplication = task.taskApplications?.[0];

    const commonClasses = `text-left block w-full p-4 lg:p-2 border-b-[1px] 
      hover:bg-baseSecondary hover:text-basePrimary rounded cursor-pointer lg:border-dashed
      ${isSelected ? "bg-baseSecondary text-basePrimaryDark font-semibold" : ""}`;

    const getStatusDisplay = () => {
      if (!taskApplication || userRole === "charity") return task.status;
      return taskApplication.status === "ACCEPTED"
        ? task.status
        : taskApplication.status;
    };

    const getStatusStyle = (status: string | null) => {
      switch (status) {
        case "COMPLETED":
          return "bg-confirmPrimary text-basePrimaryLight";
        case "IN_PROGRESS":
          return "bg-accentPrimary";
        case "ACCEPTED":
          return "bg-confirmPrimary text-basePrimaryLight";
        case "PENDING":
          return "bg-baseSecondary text-basePrimaryDark";
        case "REJECTED":
          return "bg-dangerPrimary text-basePrimaryLight";
        default:
          return "bg-basePrimaryDark text-baseSecondary";
      }
    };

    const content = (
      <>
        <div className="text-lg font-primary">{task.title}</div>
        <div className="flex justify-between items-center text-sm">
          <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
          <span
            className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(getStatusDisplay())}`}
          >
            {getStatusDisplay()}
          </span>
        </div>
      </>
    );

    if (isDashboardTasksRoute) {
      return (
        <button onClick={() => onTaskSelect?.(task)} className={commonClasses}>
          {content}
        </button>
      );
    }

    return (
      <Link to={task.id} className={commonClasses}>
        {content}
      </Link>
    );
  };

  return (
    <ul className="lg:space-y-0 text-baseSecondary">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskItem task={task} />
        </li>
      ))}
    </ul>
  );
}
