import { useState } from "react";
import { format } from "date-fns";
import {
  ClipboardText,
  UsersThree,
  ArrowDown,
  ArrowUp,
} from "@phosphor-icons/react";
import type { tasks } from "@prisma/client";
import type { CombinedCollections } from "~/types/tasks";

interface CharityTasksSectionProps {
  tasks: tasks[] | CombinedCollections[];
  onTaskSelect?: (task: tasks | CombinedCollections) => void;
  charityName?: string;
}

export default function CharityTasksSection({
  tasks = [],
  onTaskSelect,
  charityName,
}: CharityTasksSectionProps) {
  const [taskSortOrder, setTaskSortOrder] = useState<"asc" | "desc">("desc");
  const [taskFilter, setTaskFilter] = useState<string | null>(null);

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((task) => {
    if (!taskFilter) return true;
    if (taskFilter === "active")
      return task.status !== "COMPLETED" && task.status !== "CANCELLED";
    if (taskFilter === "completed") return task.status === "COMPLETED";
    return true;
  });

  // Sort tasks by creation date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return taskSortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // Toggle task sort order
  const toggleSortOrder = () => {
    setTaskSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  return (
    <div
      id="tasks"
      className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-sm mb-8"
    >
      <div className="px-6 py-4 border-b border-baseSecondary/10 flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-baseSecondary">
          {charityName ? `${charityName} Tasks` : "Available Tasks"}
        </h2>
        <div className="flex items-center gap-3">
          {/* Filter controls */}
          <div className="flex text-sm">
            <button
              className={`px-3 py-1 rounded-l-lg border border-r-0 border-baseSecondary/20 ${!taskFilter ? "bg-baseSecondary text-basePrimaryLight" : "bg-basePrimary/40 text-baseSecondary"}`}
              onClick={() => setTaskFilter(null)}
            >
              All
            </button>
            <button
              className={`px-3 py-1 border-y border-baseSecondary/20 ${taskFilter === "active" ? "bg-baseSecondary text-basePrimaryLight" : "bg-basePrimary/40 text-baseSecondary"}`}
              onClick={() => setTaskFilter("active")}
            >
              Active
            </button>
            <button
              className={`px-3 py-1 rounded-r-lg border border-l-0 border-baseSecondary/20 ${taskFilter === "completed" ? "bg-baseSecondary text-basePrimaryLight" : "bg-basePrimary/40 text-baseSecondary"}`}
              onClick={() => setTaskFilter("completed")}
            >
              Completed
            </button>
          </div>

          {/* Sort button */}
          <button
            onClick={toggleSortOrder}
            className="inline-flex items-center px-3 py-1 rounded-lg bg-basePrimary/40 text-baseSecondary border border-baseSecondary/20"
            title={taskSortOrder === "desc" ? "Newest first" : "Oldest first"}
          >
            {taskSortOrder === "desc" ? (
              <>
                Newest <ArrowDown size={14} className="ml-1" />
              </>
            ) : (
              <>
                Oldest <ArrowUp size={14} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {sortedTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-basePrimary/40 rounded-lg p-4 border border-baseSecondary/20 hover:border-baseSecondary/60 cursor-pointer transition-all"
                onClick={() => onTaskSelect && onTaskSelect(task)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (onTaskSelect) {
                      onTaskSelect(task);
                    }
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select task: ${task.title}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-baseSecondary">
                    {task.title}
                  </h3>
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${
                      task.status === "COMPLETED"
                        ? "bg-confirmPrimary/20 text-confirmPrimary"
                        : task.status === "CANCELLED"
                          ? "bg-dangerPrimary/20 text-dangerPrimary"
                          : "bg-accentPrimary/20 text-indicator-orange"
                    }`}
                  >
                    {task.status === "COMPLETED"
                      ? "Completed"
                      : task.status === "CANCELLED"
                        ? "Cancelled"
                        : "Active"}
                  </div>
                </div>

                <p className="text-baseSecondary/70 text-sm line-clamp-2 mb-3">
                  {task.description}
                </p>

                {/* Task metadata */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {task.category?.map((category, index) => (
                    <span
                      key={index}
                      className="text-xs bg-baseSecondary/10 text-baseSecondary/80 px-2 py-1 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-baseSecondary/60">
                  <span>
                    Deadline: {format(new Date(task.deadline), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center">
                    <UsersThree size={14} className="mr-1" />
                    {task.volunteersNeeded} volunteer
                    {task.volunteersNeeded !== 1 ? "s" : ""} needed
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <ClipboardText
              size={40}
              className="mx-auto text-baseSecondary/30 mb-3"
            />
            <h3 className="text-lg font-medium text-baseSecondary mb-1">
              No tasks found
            </h3>
            <p className="text-baseSecondary/70">
              {taskFilter
                ? `No ${taskFilter} tasks available at this time.`
                : "No tasks available yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
