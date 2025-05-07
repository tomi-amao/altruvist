import { differenceInDays } from "date-fns";

import { Link } from "react-router";
import { tasks } from "@prisma/client";

interface SectionProps {
  title: string;
  tasks: Partial<tasks>[];
  userRole: string;
}

interface ListItemProps {
  text: string;
  deadline?: Date | string | null;
  status?: string | null;
  applicationStatus?: string | null;
  section: string;
  userRole: string;
}

const ListItem = ({
  text,
  deadline,
  status,
  applicationStatus,
  section,
}: ListItemProps) => {
  // Handle the case where deadline is null or undefined
  if (
    !deadline &&
    section !== "Task Applications" &&
    section !== "Completed Tasks"
  ) {
    return (
      <li className="py-3 px-4 border-b border-basePrimaryDark last:border-b-0 hover:bg-basePrimaryLight transition-colors">
        <div className="flex justify-between items-center gap-4">
          <span className="flex-1">{text || "Untitled Task"}</span>
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-baseSecondary">
              No deadline
            </span>
          </div>
        </div>
      </li>
    );
  }

  const now = new Date();
  const dueDate = deadline ? new Date(deadline) : now;
  const daysRemaining = differenceInDays(dueDate, now);

  // Helper function to determine status color
  const getStatusColor = (days: number) => {
    if (days <= 2) return "text-dangerPrimary";
    if (days <= 5) return "text-accentPrimary";
    return "text-baseSecondary";
  };

  // Determine the deadline display text
  const getDeadlineText = () => {
    if (status === "COMPLETED") return null;
    if (daysRemaining === 0) return "Due today";
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)} days overdue`;
    return `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} left`;
  };

  const deadlineText = getDeadlineText();

  switch (section) {
    case "Task Applications":
      return (
        <li className="py-3 px-4 border-b border-basePrimaryDark last:border-b-0 hover:bg-basePrimaryLight transition-colors">
          <div className="flex justify-between items-center gap-4">
            <span className="flex-1">{text || "Untitled Task"}</span>
            <div className="flex flex-col items-end">
              {applicationStatus || "Pending"}
            </div>
          </div>
        </li>
      );
    case "In Progress Tasks":
      return (
        <li className="py-3 px-4 border-b border-basePrimaryDark last:border-b-0 hover:bg-basePrimaryLight transition-colors">
          <div className="flex justify-between items-center gap-4">
            <span className="flex-1">{text || "Untitled Task"}</span>
            <div className="flex flex-col items-end">
              {deadlineText && (
                <span
                  className={`text-sm font-medium ${getStatusColor(daysRemaining)}`}
                >
                  {deadlineText}
                </span>
              )}
            </div>
          </div>
        </li>
      );
    case "Completed Tasks":
      return (
        <li className="py-3 px-4 border-b border-basePrimaryDark last:border-b-0 hover:bg-basePrimaryLight transition-colors">
          <div className="flex justify-between items-center gap-4">
            <span className="flex-1">{text || "Untitled Task"}</span>
            <div className="flex flex-col items-end"></div>
          </div>
        </li>
      );
    case "Not Started Tasks":
    case "Tasks Nearing Deadline":
      return (
        <li className="py-3 px-4 border-b border-basePrimaryDark last:border-b-0 hover:bg-basePrimaryLight transition-colors">
          <div className="flex justify-between items-center gap-4">
            <span className="flex-1">{text || "Untitled Task"}</span>
            <div className="flex flex-col items-end">
              {deadlineText && (
                <span
                  className={`text-sm font-medium ${getStatusColor(daysRemaining)}`}
                >
                  {deadlineText}
                </span>
              )}
            </div>
          </div>
        </li>
      );
    default:
      return (
        <li className="py-3 px-4 border-b border-basePrimaryDark last:border-b-0 hover:bg-basePrimaryLight transition-colors">
          <div className="flex justify-between items-center gap-4">
            <span className="flex-1">{text || "Untitled Task"}</span>
            <div className="flex flex-col items-end">
              {applicationStatus}
              {deadlineText && (
                <span
                  className={`text-sm font-medium ${getStatusColor(daysRemaining)}`}
                >
                  {deadlineText}
                </span>
              )}
            </div>
          </div>
        </li>
      );
  }
};

const Section = ({ title, tasks, userRole }: SectionProps) => (
  <div className="bg-basePrimary rounded-lg shadow-lg overflow-hidden flex flex-col">
    <h2 className="text-xl !text-basePrimary font-semibold font-primary p-4 bg-baseSecondary text-txtsecondary sticky top-0">
      {title}
    </h2>
    <div className="divide-y divide-basePrimaryDark overflow-y-auto max-h-[200px] sm:max-h-[250px] md:max-h-[300px] lg:max-h-[350px]">
      {tasks && tasks.length > 0 ? (
        <ul className="cursor-pointer">
          {tasks.map((task, index) => (
            <Link
              key={task?.id || index}
              to={task?.id ? `/dashboard/tasks?taskid=${task.id}` : "#"}
              className="block hover:bg-basePrimaryLight transition-colors"
            >
              <ListItem
                key={index}
                text={task?.title || "Untitled Task"}
                deadline={task?.deadline}
                status={task?.status}
                applicationStatus={task?.taskApplications?.[0]?.status || ""}
                section={title}
                userRole={userRole}
              />
            </Link>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-altMidGrey italic">No items to display</p>
      )}
    </div>
  </div>
);

export { ListItem, Section };
