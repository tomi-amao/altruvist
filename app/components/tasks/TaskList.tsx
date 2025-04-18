import { Link, useLocation } from "@remix-run/react";
import type { tasks } from "@prisma/client";
import { Calendar, CheckCircle, CircleNotch, ClockClockwise, XCircle } from "phosphor-react";

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

  // Loading, error and empty states with improved styling
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 w-full">
        <CircleNotch className="animate-spin w-8 h-8 text-accentPrimary" weight="bold" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-dangerPrimary bg-dangerPrimary/10 rounded-lg border border-dangerPrimary/20 my-2">
        <XCircle size={24} className="mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }
  
  if (!tasks?.length) {
    return (
      <div className="p-6 text-center text-baseSecondary/70 bg-basePrimary/50 rounded-lg border border-baseSecondary/10 my-2">
        <ClockClockwise size={32} className="mx-auto mb-3 text-baseSecondary/50" />
        <p className="text-lg font-medium">No tasks found</p>
        <p className="text-sm mt-1">{userRole === "charity" ? "Try adjusting your filters or create a new task" : "Try adjusting your filters or volunteer for a new task"}</p>
      </div>
    );
  }

  const TaskItem = ({ task }: { task: TaskListProps["tasks"][0] }) => {
    const isSelected = task.id === selectedTaskId;
    const taskApplication = task.taskApplications?.[0];

    // Enhanced styling for task items with responsive design
    const commonClasses = `text-left block w-full px-4 py-3 sm:py-4 mb-2 
      transition-all duration-200 ease-in-out
      border border-baseSecondary/10 hover:border-baseSecondary/30
      hover:bg-baseSecondary/5 focus:bg-baseSecondary/10
      rounded-lg cursor-pointer 
      ${isSelected ? "bg-baseSecondary/10 border-baseSecondary/30 shadow-sm" : "bg-basePrimary"}`;

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
          return "bg-accentPrimary text-basePrimaryLight";
        case "ACCEPTED":
          return "bg-confirmPrimary text-basePrimaryLight";
        case "PENDING":
          return "bg-baseSecondary text-basePrimaryDark";
        case "REJECTED":
          return "bg-dangerPrimary text-basePrimaryLight";
        case "WITHDRAWN":
          return "bg-dangerPrimary/60 text-basePrimaryLight";
        case "CANCELLED":
          return "bg-baseSecondary/60 text-basePrimaryDark";
        default:
          return "bg-basePrimaryDark text-baseSecondary";
      }
    };

    // Get status icon based on status
    const getStatusIcon = (status: string | null) => {
      switch (status) {
        case "COMPLETED":
          return <CheckCircle size={16} weight="fill" />;
        case "IN_PROGRESS":
          return <CircleNotch size={16} weight="fill" />;
        case "ACCEPTED":
          return <CheckCircle size={16} weight="fill" />;
        case "PENDING":
          return <ClockClockwise size={16} weight="fill" />;
        case "REJECTED":
          return <XCircle size={16} weight="fill" />;
        default:
          return null;
      }
    };

    const displayStatus = getStatusDisplay();

    const content = (
      <>
        <div className="flex flex-col space-y-2">
          {/* Task title with responsive sizing */}
          <h3 className="text-base sm:text-lg font-medium text-baseSecondary line-clamp-2 break-words">
            {task.title}
          </h3>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-1">
            {/* Date section with icon */}
            <div className="flex items-center text-sm text-baseSecondary/80">
              <Calendar size={14} className="mr-1" weight="fill" />
              <span className="whitespace-nowrap">
                {new Date(task.deadline).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            {/* Status badge with icon and enhanced visibility */}
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                shadow-sm transition-all duration-200 ${getStatusStyle(displayStatus)}`}
            >
              {getStatusIcon(displayStatus)}
              <span className="ml-1">{displayStatus}</span>
            </div>
          </div>
        </div>
      </>
    );

    if (isDashboardTasksRoute) {
      return (
        <button 
          onClick={() => onTaskSelect?.(task)} 
          className={commonClasses}
          role="tab"
          aria-selected={isSelected}
          aria-label={`Select task: ${task.title}`}
        >
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
    <ul className="space-y-2 overflow-y-auto max-h-[60vh] pb-2 px-1">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskItem task={task} />
        </li>
      ))}
    </ul>
  );
}
