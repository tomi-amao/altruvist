import { TaskUrgency } from "@prisma/client";
import { format } from "date-fns";
import { useFetcher, useNavigate } from "@remix-run/react";
import { PrimaryButton, SecondaryButton } from "../utils/BasicButton";
import { FilePreviewButton } from "../utils/FormField";
import { Clock, Users } from "phosphor-react";

interface Resource {
  name: string;
  size: number;
  uploadURL: string;
  extension: string;
}

interface TaskDetailsCardProps {
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
}

export default function TaskDetailsCard({
  category,
  charityId,
  id,
  description,
  title,
  impact,
  requiredSkills,
  urgency,
  volunteersNeeded,
  deliverables,
  deadline,
  status,
  resources,
  userRole,
  volunteerDetails,
  taskApplications = [],
}: TaskDetailsCardProps) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const showMessage = true;

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

  // Check if user has already applied
  const hasApplied = volunteerDetails?.taskApplications?.includes(id);

  // Count accepted applications
  const acceptedApplications = taskApplications.filter(
    (app) => app.status === "ACCEPTED",
  ).length;

  // Use volunteersNeeded as the total volunteer capacity
  const totalVolunteersNeeded = volunteersNeeded;
  const isTaskFull = acceptedApplications >= totalVolunteersNeeded;

  // Calculate spots remaining
  const spotsRemaining = totalVolunteersNeeded - acceptedApplications;

  const renderActionButton = () => {
    if (!userRole?.includes("volunteer")) {
      return (
        <p className="bg-basePrimaryDark text-baseSecondary px-4 py-2 rounded-md">
          Only volunteers can apply to tasks
        </p>
      );
    }

    if (isTaskFull) {
      return (
        <p className="bg-basePrimaryDark text-baseSecondary px-4 py-2 rounded-md">
          This task is full ({acceptedApplications}/{volunteersNeeded}{" "}
          volunteers)
        </p>
      );
    }

    if (hasApplied) {
      return (
        <SecondaryButton
          text="Go to Task"
          ariaLabel="go to task"
          action={() => navigate(`/dashboard/tasks?taskid=${id}`)}
        />
      );
    }
    return (
      <PrimaryButton
        text="Volunteer"
        ariaLabel="volunteer for task"
        action={() => handleApply(id, charityId || "")}
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

  return (
    <article className="bg-basePrimary rounded-xl shadow-lg overflow-hidden transition-shadow hover:shadow-xl">
      {/* Hero Section */}
      <div className="bg-basePrimaryDark p-8 border-b border-baseSecondary/20">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <h1 className="text-3xl md:text-4xl font-semibold  text-baseSecondary tracking-normal">
              {title}
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`
                ${getUrgencyColor(urgency)} 
                px-4 py-1.5 
                rounded-full 
                text-txtsecondary 
                text-sm 
                font-medium
                transition-transform
                hover:scale-105
              `}
              >
                {urgency.toLowerCase()} priority
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-baseSecondary/80">
            <span className="flex items-center gap-2 text-sm hover:text-baseSecondary transition-colors">
              <Clock className="w-5 h-5" />
              Due {format(deadline, "MMM dd, yyyy")}
            </span>
            <span className="flex items-center gap-2 text-sm">
              <Users className="w-5 h-5" />
              <span className="font-medium">{volunteersNeeded}</span>
              volunteer{volunteersNeeded !== 1 ? "s" : ""} needed
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        {/* Impact Card */}
        <section className="bg-basePrimaryLight rounded-lg p-6 transform transition-all hover:scale-[1.01]">
          <h3 className="text-lg font-semibold text-baseSecondary mb-3">
            Impact
          </h3>
          <p className="text-baseSecondary/90 leading-relaxed">{impact}</p>
        </section>

        {/* Description */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-baseSecondary">
            Description
          </h3>
          <p className="text-baseSecondary/90 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </section>

        {/* Skills and Categories Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h3 className="text-lg font-semibold text-baseSecondary mb-3">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-basePrimaryDark px-4 py-2 rounded-full 
                    text-sm text-baseSecondary transition-all 
                    hover:bg-baseSecondary hover:text-basePrimary
                    cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-baseSecondary mb-3">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.map((cat, index) => (
                <span
                  key={index}
                  className="bg-basePrimaryDark px-4 py-2 rounded-full 
                    text-sm text-baseSecondary transition-all 
                    hover:bg-baseSecondary hover:text-basePrimary
                    cursor-default"
                >
                  {cat}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Deliverables */}
        {deliverables && deliverables.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-baseSecondary">
              Deliverables
            </h3>
            <ul className="space-y-3">
              {deliverables.map((deliverable, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 
                    bg-basePrimaryDark rounded-lg
                    transform transition-all hover:scale-[1.01] md:w-[50%]"
                >
                  <span
                    className="w-6 h-6 flex-shrink-0 flex items-center justify-center 
                    bg-baseSecondary text-basePrimary rounded-full text-sm font-medium"
                  >
                    {index + 1}
                  </span>
                  <p className="text-baseSecondary/90">{deliverable}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Resources Grid */}
        {resources && resources.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-baseSecondary">
              Resources
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {resources.map((resource, index) => (
                <FilePreviewButton
                  key={index}
                  fileName={resource.name}
                  fileSize={resource.size}
                  fileUrl={resource.uploadURL}
                  fileExtension={resource.extension}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="bg-basePrimaryDark p-6 border-t border-baseSecondary/20">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-baseSecondary/80">
            <span className="px-3 py-1 rounded-full bg-basePrimary">
              {status}
            </span>
            {status !== "COMPLETED" && (
              <span>
                {spotsRemaining} spot{spotsRemaining !== 1 ? "s" : ""} remaining
              </span>
            )}
          </div>
          {status !== "COMPLETED" && (
            <div className="flex items-center gap-4">
              {renderActionButton()}
            </div>
          )}
        </div>

        {fetcher.state !== "idle" && (
          <div className="mt-4 text-center">
            <div className="inline-block px-4 py-2 bg-basePrimary rounded-full">
              <div className="animate-pulse">Processing...</div>
            </div>
          </div>
        )}

        {fetcher.data && showMessage && (
          <div className="mt-4 text-center">
            <div
              className={`inline-block px-4 py-2 rounded-full 
              ${fetcher.data.error ? "bg-dangerPrimary" : "bg-confirmPrimary"}`}
            >
              {fetcher.data.message}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
