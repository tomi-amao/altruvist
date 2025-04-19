import { TaskUrgency } from "@prisma/client";
import { format } from "date-fns";
import { useFetcher, useNavigate } from "@remix-run/react";
import { PrimaryButton, SecondaryButton } from "../utils/BasicButton";
import { FilePreviewButton } from "../utils/FormField";
import {
  Clock,
  Users,
  Target,
  Tag,
  Lightbulb,
  MapPin,
  NotePencil,
  ListChecks,
  Files,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

interface Resource {
  name: string;
  size: number;
  uploadURL: string;
  extension: string;
}

interface TaskDetailsData {
  category: string[];
  charityName: string;
  charityId: string | null;
  id: string;
  description: string;
  title: string;
  impact: string;
  requiredSkills: string[];
  urgency: TaskUrgency;
  volunteersNeeded: number;
  deliverables: string[];
  deadline: Date;
  userId: string;
  status: string;
  resources: Resource[];
  userRole: string[];
  volunteerDetails?: {
    userId: string;
    taskApplications?: string[];
  };
  taskApplications?: {
    id: string;
    status: string;
    userId: string;
  }[];
  location?: {
    address: string;
    lat?: number;
    lng?: number;
  } | null;
}

// Props that only need taskId
interface TaskDetailsCardProps {
  taskId: string;
  userRole?: string[];
  volunteerDetails?: {
    userId: string;
    taskApplications?: string[];
  };
}

// Type alias for full prop data
type ExpandedTaskDetailsCardProps = TaskDetailsData;

// Union type to accept either minimal or full props
type CombinedTaskDetailsCardProps =
  | TaskDetailsCardProps
  | ExpandedTaskDetailsCardProps;

export default function TaskDetailsCard(props: CombinedTaskDetailsCardProps) {
  const fetcher = useFetcher();
  const taskFetcher = useFetcher();
  const navigate = useNavigate();
  const [showMessage, setShowMessage] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [taskData, setTaskData] = useState<TaskDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to automatically hide success/error messages after 5 seconds
  useEffect(() => {
    if (fetcher.data && showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [fetcher.data, showMessage]);

  // Check if we're using the minimal props version with just taskId
  const isMinimalProps = "taskId" in props && !("title" in props);
  const taskId = isMinimalProps ? (props as TaskDetailsCardProps).taskId : "";

  // If minimal props, fetch the task data
  useEffect(() => {
    if (isMinimalProps && !isLoading && !taskData) {
      setIsLoading(true);
      taskFetcher.load(`/api/task/${taskId}`);
    } else if (!isMinimalProps) {
      // If full props, use them directly
      setTaskData(props as TaskDetailsData);
    }
  }, [isMinimalProps, taskId, isLoading, taskData, taskFetcher]);

  // Handle task data fetching response
  useEffect(() => {
    if (taskFetcher.data) {
      if (taskFetcher.data.error) {
        setError(taskFetcher.data.error);
      } else if (taskFetcher.data.task) {
        const fetchedTask = taskFetcher.data.task;

        // Transform fetched data to match the expected TaskDetailsData structure
        setTaskData({
          ...fetchedTask,
          charityName: fetchedTask.charity?.name || "",
          charityId: fetchedTask.charity?.id || null,
          userRole: isMinimalProps
            ? (props as TaskDetailsCardProps).userRole || []
            : [],
          volunteerDetails: isMinimalProps
            ? (props as TaskDetailsCardProps).volunteerDetails
            : undefined,
          resources: fetchedTask.resources || [],
          taskApplications: fetchedTask.taskApplications || [],
        });
      }
      setIsLoading(false);
    }
  }, [taskFetcher.data, isMinimalProps]);

  const handleApply = (taskId: string, charityId: string) => {
    fetcher.submit(
      { taskId, charityId },
      { method: "post", action: "/api/apply-for-task" },
    );
  };

  const handleWithdraw = (taskId: string, userId: string) => {
    fetcher.submit(
      {
        _action: "deleteApplication",
        taskId,
        userId,
      },
      { method: "POST", action: "/dashboard/tasks" },
    );
  };

  // Return loading state if data is not ready yet
  if (isLoading || (!taskData && !error)) {
    return (
      <div className="bg-basePrimary rounded-xl shadow-lg p-8 flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-baseSecondary/30 border-t-baseSecondary rounded-full animate-spin mb-4"></div>
          <p className="text-baseSecondary/80">Loading task details...</p>
        </div>
      </div>
    );
  }

  // Return error state if there was an error fetching the data
  if (error) {
    return (
      <div className="bg-basePrimary rounded-xl shadow-lg p-8 flex justify-center items-center h-64">
        <div className="flex flex-col items-center text-dangerPrimary">
          <p className="font-semibold mb-2">Error loading task</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // If we have data, render the card
  if (!taskData) return null;

  // Check if user has already applied
  const hasApplied = taskData.volunteerDetails?.taskApplications?.includes(
    taskData.id,
  );

  // Count accepted applications
  const acceptedApplications =
    taskData.taskApplications?.filter((app) => app.status === "ACCEPTED")
      .length || 0;

  // Use volunteersNeeded as the total volunteer capacity
  const totalVolunteersNeeded = taskData.volunteersNeeded;
  const isTaskFull = acceptedApplications >= totalVolunteersNeeded;

  // Calculate spots remaining
  const spotsRemaining = totalVolunteersNeeded - acceptedApplications;

  const renderActionButton = () => {
    if (!taskData.userRole?.includes("volunteer")) {
      return (
        <div className="px-4 py-2 rounded-md bg-basePrimaryDark text-baseSecondary/80 border border-baseSecondary/20 text-sm flex items-center justify-center">
          <span className="mr-1.5">👋</span> Only volunteers can apply to tasks
        </div>
      );
    }

    if (isTaskFull) {
      return (
        <div className="px-4 py-2 rounded-md bg-basePrimaryDark text-baseSecondary/80 border border-baseSecondary/20 text-sm flex items-center justify-center">
          <span className="mr-1.5">🔒</span> Task full ({acceptedApplications}/
          {taskData.volunteersNeeded} volunteers)
        </div>
      );
    }

    if (hasApplied) {
      return (
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <SecondaryButton
            text="Go to Task"
            ariaLabel="go to task"
            action={() => navigate(`/dashboard/tasks?taskid=${taskData.id}`)}
          />
          <SecondaryButton
            text="Withdraw"
            ariaLabel="withdraw application"
            action={() =>
              handleWithdraw(
                taskData.id,
                taskData.volunteerDetails?.userId || "",
              )
            }
          />
        </div>
      );
    }
    return (
      <PrimaryButton
        text="Volunteer Now"
        ariaLabel="volunteer for task"
        action={() => handleApply(taskData.id, taskData.charityId || "")}
      />
    );
  };

  const getUrgencyColor = (urgency: TaskUrgency) => {
    switch (urgency) {
      case "HIGH":
        return "bg-dangerPrimary";
      case "MEDIUM":
        return "bg-baseSecondary";
      case "LOW":
        return "bg-confirmPrimary";
      default:
        return "bg-altMidGrey";
    }
  };

  // For generating colored dots for category and skills
  const getColorDot = (value: string) => {
    // Simple hash function to get consistent colors for the same string
    const hash = value
      .split("")
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      "red",
      "blue",
      "green",
      "yellow",
      "purple",
      "pink",
      "indigo",
      "orange",
      "teal",
      "cyan",
    ];
    const colorIndex = hash % colors.length;
    return `bg-indicator-${colors[colorIndex]}`;
  };

  return (
    <article className="bg-basePrimary rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-baseSecondary/10">
      {/* Hero Section */}
      <div className="bg-basePrimaryDark p-6 border-b border-baseSecondary/10 relative overflow-hidden">
        {/* Background pattern for visual interest */}
        <div className="absolute inset-0 opacity-5 pattern-dots pattern-baseSecondary pattern-bg-transparent pattern-size-2"></div>

        <div className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <h1 className="text-2xl md:text-3xl font-semibold text-baseSecondary tracking-tight">
              {taskData.title}
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`
                ${getUrgencyColor(taskData.urgency)} 
                px-3 py-1.5 
                rounded-full 
                text-txtsecondary 
                text-sm 
                font-medium
                transition-all
                hover:scale-105
                flex items-center
              `}
              >
                {taskData.urgency === "HIGH" && (
                  <span className="h-2 w-2 rounded-full bg-txtsecondary animate-pulse mr-1.5"></span>
                )}
                {taskData.urgency.toLowerCase()} priority
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-baseSecondary/80">
            <span className="flex items-center gap-2 text-sm hover:text-baseSecondary transition-colors">
              <Clock className="w-4 h-4" />
              Due {format(new Date(taskData.deadline), "MMM dd, yyyy")}
            </span>
            <span className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              <span className="font-medium">{taskData.volunteersNeeded}</span>
              volunteer{taskData.volunteersNeeded !== 1 ? "s" : ""} needed
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span
                className={`inline-block w-2 h-2 rounded-full ${taskData.status === "COMPLETED" ? "bg-confirmPrimary" : "bg-baseSecondary"}`}
              ></span>
              {taskData.status}
            </span>
            {taskData.location && (
              <span className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                {taskData.location.address.length > 20
                  ? taskData.location.address.substring(0, 20) + "..."
                  : taskData.location.address}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Charity Badge */}
      <div className="bg-basePrimaryLight px-6 py-3 border-b border-baseSecondary/10">
        <div className="flex justify-between items-center">
          <span className="text-sm text-baseSecondary/80">
            Posted by{" "}
            <span className="font-medium text-baseSecondary">
              {taskData.charityName}
            </span>
          </span>

          <div className="text-sm text-baseSecondary/80">
            {taskData.status !== "COMPLETED" && (
              <span className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${spotsRemaining > 0 ? "bg-confirmPrimary" : "bg-dangerPrimary"}`}
                ></span>
                {spotsRemaining} spot{spotsRemaining !== 1 ? "s" : ""} remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`p-6 space-y-6 ${!isExpanded ? "max-h-[700px] overflow-hidden" : ""} transition-all duration-500`}
      >
        {/* Impact Card */}
        <section className="bg-basePrimaryLight rounded-lg p-5 transform transition-all hover:scale-[1.01] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-baseSecondary"></div>
          <div className="ml-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-4 h-4 text-baseSecondary/70" />
              <h3 className="text-base font-semibold text-baseSecondary">
                Impact
              </h3>
            </div>
            <p className="text-baseSecondary/90 leading-relaxed">
              {taskData.impact}
            </p>
          </div>
        </section>

        {/* Dual Column Layout for Content */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <section className="bg-basePrimaryLight rounded-lg p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-baseSecondary opacity-50"></div>
              <div className="ml-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <NotePencil className="w-4 h-4 text-baseSecondary/70" />
                  <h3 className="text-base font-semibold text-baseSecondary">
                    Description
                  </h3>
                </div>
                <p className="text-baseSecondary/90 leading-relaxed whitespace-pre-wrap">
                  {taskData.description}
                </p>
              </div>
            </section>

            {/* Deliverables */}
            {taskData.deliverables && taskData.deliverables.length > 0 && (
              <section className="bg-basePrimaryLight rounded-lg p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-baseSecondary opacity-30"></div>
                <div className="ml-2">
                  <div className="flex items-center gap-1.5 mb-3">
                    <ListChecks className="w-4 h-4 text-baseSecondary/70" />
                    <h3 className="text-base font-semibold text-baseSecondary">
                      Deliverables
                    </h3>
                  </div>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {taskData.deliverables.map((deliverable, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 
                          bg-basePrimary rounded-lg border border-baseSecondary/10
                          transform transition-all hover:scale-[1.01] hover:border-baseSecondary/20"
                      >
                        <span
                          className="w-6 h-6 flex-shrink-0 flex items-center justify-center 
                          bg-baseSecondary text-basePrimary rounded-full text-sm font-medium"
                        >
                          {index + 1}
                        </span>
                        <p className="text-baseSecondary/90 text-sm">
                          {deliverable}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Resources Grid */}
            {taskData.resources && taskData.resources.length > 0 && (
              <section className="bg-basePrimaryLight rounded-lg p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-baseSecondary opacity-20"></div>
                <div className="ml-2">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Files className="w-4 h-4 text-baseSecondary/70" />
                    <h3 className="text-base font-semibold text-baseSecondary">
                      Resources
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3">
                    {taskData.resources.map((resource, index) => (
                      <FilePreviewButton
                        key={index}
                        fileName={resource.name}
                        fileSize={resource.size}
                        fileUrl={resource.uploadURL}
                        fileExtension={resource.extension}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Required Skills */}
            <section className="bg-basePrimaryLight rounded-lg p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <Lightbulb className="w-4 h-4 text-baseSecondary/70" />
                <h3 className="text-base font-semibold text-baseSecondary">
                  Required Skills
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {taskData.requiredSkills.length > 0 ? (
                  taskData.requiredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-basePrimaryDark px-3 py-1.5 rounded-full
                        text-sm text-baseSecondary transition-all 
                        hover:bg-baseSecondary hover:text-basePrimary
                        cursor-default flex items-center gap-1.5"
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${getColorDot(skill)}`}
                      ></span>
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-baseSecondary/70 italic text-sm">
                    No specific skills required
                  </p>
                )}
              </div>
            </section>

            {/* Categories */}
            <section className="bg-basePrimaryLight rounded-lg p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <Tag className="w-4 h-4 text-baseSecondary/70" />
                <h3 className="text-base font-semibold text-baseSecondary">
                  Categories
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {taskData.category.map((cat, index) => (
                  <span
                    key={index}
                    className="bg-basePrimaryDark px-3 py-1.5 rounded-full
                      text-sm text-baseSecondary transition-all 
                      hover:bg-baseSecondary hover:text-basePrimary
                      cursor-default flex items-center gap-1.5"
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${getColorDot(cat)}`}
                    ></span>
                    {cat}
                  </span>
                ))}
              </div>
            </section>

            {/* Location if available */}
            {taskData.location && (
              <section className="bg-basePrimaryLight rounded-lg p-5">
                <div className="flex items-center gap-1.5 mb-3">
                  <MapPin className="w-4 h-4 text-baseSecondary/70" />
                  <h3 className="text-base font-semibold text-baseSecondary">
                    Location
                  </h3>
                </div>
                <p className="text-baseSecondary/90 text-sm mb-2">
                  {taskData.location.address}
                </p>
                {taskData.location.lat && taskData.location.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${taskData.location.lat},${taskData.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-baseSecondary hover:underline flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    View on Google Maps
                  </a>
                )}
              </section>
            )}

            {/* Volunteer statistics */}
            <section className="bg-basePrimaryLight rounded-lg p-5">
              <h3 className="text-base font-semibold text-baseSecondary mb-3">
                Volunteer Stats
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-baseSecondary/80">Positions:</span>
                  <span className="font-medium text-baseSecondary">
                    {taskData.volunteersNeeded}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-baseSecondary/80">Filled:</span>
                  <span className="font-medium text-baseSecondary">
                    {acceptedApplications}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-baseSecondary/80">Remaining:</span>
                  <span className="font-medium text-baseSecondary">
                    {spotsRemaining}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-baseSecondary/10">
                  <div className="w-full bg-basePrimary rounded-full h-2.5">
                    <div
                      className="bg-baseSecondary h-2.5 rounded-full"
                      style={{
                        width: `${(acceptedApplications / taskData.volunteersNeeded) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-center mt-1 text-baseSecondary/70">
                    {Math.round(
                      (acceptedApplications / taskData.volunteersNeeded) * 100,
                    )}
                    % filled
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Button for long content */}
      {taskData.description.length > 300 && (
        <div className="px-6 pb-3 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-baseSecondary hover:text-baseSecondary/80 flex items-center gap-1.5 transition-colors"
          >
            {isExpanded ? (
              <>
                Show less <span className="text-xs">↑</span>
              </>
            ) : (
              <>
                Show more <span className="text-xs">↓</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer with CTA */}
      <div className="bg-basePrimaryDark p-6 border-t border-baseSecondary/10">
        <div>{renderActionButton()}</div>

        {/* Processing state */}
        {fetcher.state !== "idle" && (
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-basePrimary rounded-full shadow-sm">
              <div className="w-4 h-4 border-2 border-baseSecondary/30 border-t-baseSecondary rounded-full animate-spin"></div>
              <span className="text-sm text-baseSecondary">Processing...</span>
            </div>
          </div>
        )}

        {/* Success/Error message */}
        {fetcher.data && showMessage && (
          <div className="mt-4 flex justify-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm
              ${fetcher.data.error ? "bg-dangerPrimary/10 text-dangerPrimary" : "bg-confirmPrimary/10 text-confirmPrimary"}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${fetcher.data.error ? "bg-dangerPrimary" : "bg-confirmPrimary"}`}
              ></span>
              <span className="text-sm">{fetcher.data.message}</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
