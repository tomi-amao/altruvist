import { useState, useEffect, SetStateAction, Dispatch } from "react";
import { useFetcher } from "@remix-run/react";
import DashboardBanner from "../cards/BannerSummaryCard";
import { SecondaryButton, PrimaryButton } from "../utils/BasicButton";
import type { taskApplications, tasks, users } from "@prisma/client";
import { FilePreviewButton, DropdownField } from "../utils/FormField";
import TaskForm from "./TaskForm";
import { TaskApplicants } from "./TaskApplicants";
import { CommentSection } from "../comment/Comment";
import getColour from "../utils/ColourGenerator";
interface TaskDetailsProps {
  task: tasks & {
    applications?: {
      user: users;
      application: taskApplications;
    }[];
  };
  userRole: string[];
  userId?: string;
  onEdit: (taskData?: tasks) => void;
  onDelete: () => void;
  isEditing: boolean;
  error?: string;
  isError?: boolean;
  setIsEditing?: Dispatch<SetStateAction<boolean>>;
  userName?: string;
}

export function TaskDetails({
  task,
  userRole,
  userId,
  onEdit,
  onDelete,
  isEditing,
  error,
  isError,
  setIsEditing,
  userName,
}: TaskDetailsProps) {
  const fetcher = useFetcher();
  const [formData, setFormData] = useState<tasks>(task);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

  const handleAcceptApplication = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "acceptTaskApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
      },
      { method: "POST" },
    );
  };

  const handleRejectApplication = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "rejectTaskApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
      },
      { method: "POST" },
    );
  };

  const handleRemoveVolunteer = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "removeVolunteer",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
      },
      { method: "POST" },
    );
  };

  const handleUndoStatus = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "undoApplicationStatus",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
      },
      { method: "POST" },
    );
  };

  const handleDeleteApplication = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "deleteApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
      },
      { method: "POST" },
    );
  };

  const handleReapply = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "undoApplicationStatus",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
      },
      { method: "POST" },
    );
  };

  const handleWithdrawApplication = (applicationId: string) => {
    {
      fetcher.submit(
        {
          _action: "withdrawApplication",
          selectedTaskApplication: JSON.stringify({ id: applicationId }),
        },
        { method: "POST" },
      );
    }
  };

  // Update form data when task changes
  useEffect(() => {
    setFormData({
      ...task,
      requiredSkills: task.requiredSkills || [],
    });
  }, [task]);

  const handleSubmit = () => {
    console.log("Taskform data", formData);

    onEdit(formData);
  };

  const handleUpdateTaskStatus = (status: string) => {
    fetcher.submit(
      {
        _action: "updateTask",
        taskId: task.id,
        updateTaskData: JSON.stringify({ status: status }),
      },
      { method: "POST" },
    );
    console.log("Task status updated", status, task.id);
  };

  // Ensure we have valid data
  const displayData = formData || task;
  const requiredSkills = displayData.requiredSkills || [];

  const listDotStyling = (value: string) => {
    const dotColour = getColour(value);
    const colorClass = `bg-indicator-${dotColour}`;
    return (
      <span className={`inline-block w-2 h-2 rounded-full ${colorClass}`}></span>
    );
  };

  return (
    <div className="bg-basePrimary rounded-lg shadow-lg p-6 lg:border border-baseSecondary">
      {/* Error message section */}
      {isError && (
        <div className="mb-4 lg:p-4 bg-dangerPrimary/10 border border-dangerPrimary rounded-lg">
          <span className="text-dangerPrimary">
            {error || "An error occurred"}
          </span>
        </div>
      )}

      {/* Banner with key information */}
      <DashboardBanner
        bannerItems={[
          { title: "Title", value: displayData.title ?? "N/A" },
          {
            title: "Deadline",
            value: displayData.deadline
              ? new Date(displayData.deadline).toLocaleDateString()
              : "N/A",
          },
          { title: "Status", value: displayData.status ?? "N/A" },
          { title: "Charity", value: displayData.charity.name ?? "N/A" },
        ]}
      />

      {isEditing ? (
        <TaskForm
          initialData={task}
          onSubmit={handleSubmit}
          onCancel={() => setIsEditing(false)}
          isEditing={true}
          error={error}
        />
      ) : (
        <div className="max-w-7xl mx-auto mt-5">
          {/* Header Section with Key Info */}
          <div className="bg-basePrimaryLight rounded-xl p-8 mb-6 relative overflow-hidden transform transition-all duration-300 hover:shadow-lg">
            {/* Priority Badge with enhanced visibility and animation */}
            <div className="absolute top-4 right-4 transform transition-transform duration-300 hover:scale-105 z-10">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
                  shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg
                  ${displayData.urgency === "HIGH"
                    ? "bg-dangerPrimary text-basePrimaryLight"
                    : displayData.urgency === "MEDIUM"
                      ? "bg-accentPrimary text-baseSecondary"
                      : "bg-confirmPrimary text-basePrimaryLight"
                  }`}
              >
                <span className=" h-2 w-2 -ml-2 rounded-full  animate-pulse"></span>
                {displayData.urgency?.toLowerCase()} priority
              </span>
            </div>

            <div className="space-y-8 ">
              {/* Impact Statement with enhanced visual treatment */}
              <div
                className="relative p-6 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 backdrop-blur-sm
                     border border-baseSecondary/10 transition-all duration-300 hover:border-baseSecondary/20"
              >
                <h3
                  className="text-base font-semibold  tracking-wider text-baseSecondary mb-3
                     flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Impact
                </h3>
                <p
                  className="text-baseSecondary text-lg leading-relaxed font-light
                     [text-wrap:balance] tracking-wide"
                >
                  {displayData.impact}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description Section */}
              <section
                className="bg-basePrimaryLight rounded-xl p-8 transition-all duration-300 hover:shadow-lg"
                aria-labelledby="task-description-heading"
              >
                <div
                  className="relative p-6 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 
                  backdrop-blur-sm border border-baseSecondary/10 transition-all duration-300 
                  hover:border-baseSecondary/20 hover:bg-gradient-to-br hover:from-basePrimary/10 hover:to-basePrimary/15"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-baseSecondary/70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3
                      id="task-description-heading"
                      className="text-base font-semibold tracking-wider text-baseSecondary"
                    >
                      About this task
                    </h3>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-baseSecondary/10 rounded-full"></div>
                    <p
                      className="text-baseSecondary text-lg leading-relaxed font-light tracking-wide
                    [text-wrap:balance] pl-4 transition-all duration-300 group-hover:text-baseSecondary/90"
                    >
                      {displayData.description || "No description provided."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Deliverables Section */}
              {displayData.deliverables &&
                displayData.deliverables.length > 0 && (
                  <section
                    className="bg-basePrimaryLight rounded-xl p-8 transition-all duration-300 hover:shadow-lg"
                    aria-labelledby="deliverables-heading"
                  >
                    <div
                      className="relative p-6 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 
                      backdrop-blur-sm border border-baseSecondary/10 transition-all duration-300 
                      hover:border-baseSecondary/20"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <svg
                          className="w-5 h-5 text-baseSecondary/70"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <h3
                          id="deliverables-heading"
                          className="text-base font-semibold tracking-wider text-baseSecondary"
                        >
                          Key Deliverables
                        </h3>
                      </div>

                      <ul
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {displayData.deliverables.map((deliverable, index) => (
                          <li
                            key={index}
                            className="group relative p-4 bg-basePrimary rounded-lg border border-baseSecondary/10
                              transition-all duration-300 hover:border-baseSecondary/20 hover:shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className="w-6 h-6 bg-baseSecondary text-basePrimary rounded-full 
                                flex items-center justify-center flex-shrink-0 font-medium
                                 group-hover:scale-110 transition-all duration-300"
                              >
                                {index + 1}
                              </span>
                              <span
                                className="text-baseSecondary leading-relaxed [text-wrap:balance]
                                group-hover:text-baseSecondary/90"
                              >
                                {deliverable}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

              <div>
                {userRole.includes("charity") &&
                  displayData.taskApplications && (
                    <div className="bg-basePrimaryLight rounded-xl p-6 mt-6">
                      <TaskApplicants
                        applicants={displayData.taskApplications
                          .filter((app) =>
                            ["ACCEPTED", "PENDING"].includes(app.status),
                          )
                          .map((app) => ({
                            application: app,
                            user: app.user,
                          }))}
                        volunteersNeeded={displayData.volunteersNeeded}
                        acceptedCount={
                          displayData.taskApplications.filter(
                            (app) => app.status === "ACCEPTED",
                          ).length
                        }
                        onAccept={handleAcceptApplication}
                        onReject={handleRejectApplication}
                        onRemoveVolunteer={handleRemoveVolunteer}
                        onUndoStatus={handleUndoStatus}
                      />
                    </div>
                  )}
              </div>

              {/* Resources Section */}
              {displayData.resources && displayData.resources.length > 0 && (
                <section
                  className="bg-basePrimaryLight rounded-xl p-8 transition-all duration-300 hover:shadow-lg"
                  aria-labelledby="resources-heading"
                >
                  <div
                    className="relative p-6 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 
                    backdrop-blur-sm border border-baseSecondary/10 transition-all duration-300 
                    hover:border-baseSecondary/20"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <svg
                        className="w-6 h-6 text-baseSecondary/70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      <h2
                        id="resources-heading"
                        className="text-base font-semibold tracking-wide text-baseSecondary"
                      >
                        Resources & Materials
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayData.resources.map((resource, index) => (
                        <div key={index} className="relative">
                          <FilePreviewButton
                            fileName={resource.name}
                            fileSize={resource.size}
                            fileUrl={resource.uploadURL}
                            fileExtension={resource.extension}
                          />
                        </div>
                      ))}
                    </div>

                    {displayData.resources.length === 0 && (
                      <p className="text-baseSecondary/70 text-center py-4">
                        No resources available for this task
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Quick Stats Card */}
              <div className="bg-basePrimaryLight rounded-xl p-8">
                <div
                  className="bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 rounded-xl p-6 backdrop-blur-sm
                  border border-baseSecondary/10 transition-all duration-300 hover:border-baseSecondary/20"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-6">
                    <svg
                      className="w-5 h-5 text-baseSecondary/70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h2 className="text-lg font-semibold tracking-wide text-baseSecondary">
                      Task Details
                    </h2>
                  </div>

                  <div className="space-y-8">
                    {/* Team Size Card */}
                    <div
                      className="group relative overflow-hidden bg-basePrimary rounded-lg p-5 
                    transition-all duration-300 hover:shadow-md"
                    >
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-accentPrimary/5 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                      <h3 className="text-sm font-medium uppercase tracking-wider text-baseSecondary/70 mb-2">
                        Team Size
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-baseSecondary">
                          {displayData.volunteersNeeded}
                        </span>
                        <span className="text-base text-baseSecondary/80">
                          volunteer
                          {displayData.volunteersNeeded !== 1 ? "s" : ""} needed
                        </span>
                      </div>
                    </div>

                    {/* Required Skills Section */}
                    <div>
                      <h3
                        className="text-sm font-medium uppercase tracking-wider text-baseSecondary/70 mb-4
                    flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {requiredSkills.length > 0 ? (
                          requiredSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-basePrimary px-4 py-2 rounded-lg text-sm text-baseSecondary
                        border border-baseSecondary/10 transition-all duration-300
                        hover:border-baseSecondary/20 hover:shadow-sm hover:scale-105
                        flex items-center gap-2"
                            >
                              {listDotStyling(skill)}
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-baseSecondary/60 text-sm italic">
                            No specific skills required
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  {displayData.category && displayData.category.length > 0 && (
                    <div className="mt-8">
                      <h3
                        className="text-sm font-medium uppercase tracking-wider text-baseSecondary/70 mb-4
                        flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        Categories
                      </h3>

                      <div
                        className="flex flex-wrap gap-2"
                        aria-label="Task categories"
                      >
                        {displayData.category.map((cat, index) => (
                          <span
                            key={index}
                            className="group relative bg-basePrimary px-4 py-2 rounded-lg 
                              border border-baseSecondary/10 transition-all duration-300
                              hover:border-baseSecondary/20 hover:shadow-sm
                              flex items-center gap-2"
                          >
                            {listDotStyling(cat)}

                            <span
                              className="text-sm font-medium text-baseSecondary/80 
                              group-hover:text-baseSecondary transition-colors duration-300"
                            >
                              {cat}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {userRole.includes("charity") && (
                    <div className="mt-8">
                      <h3
                        className="text-sm font-medium uppercase tracking-wider text-baseSecondary/70 mb-4
                        flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                        Task Status
                      </h3>

                      <DropdownField
                        htmlFor="urgency"
                        // label="Change Task Status"
                        value={formData.status}
                        onChange={(value) => handleUpdateTaskStatus(value)}
                        options={[
                          { value: "NOT_STARTED", label: "Not Started" },
                          { value: "IN_PROGRESS", label: "In Progress" },
                          { value: "COMPLETED", label: "Completed " },
                          { value: "CANCELLED", label: "Cancelled" },
                        ]}
                        backgroundColour="bg-basePrimary"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Sticky on mobile */}
              <div className=" bottom-0 bg-basePrimaryLight rounded-xl p-6 space-y-3 z-auto">
                {userRole.includes("charity") ? (
                  <>
                    <SecondaryButton
                      ariaLabel="edit"
                      text="Edit Task"
                      action={() => onEdit()}
                    />
                    <SecondaryButton
                      ariaLabel="delete"
                      text="Delete Task"
                      action={onDelete}
                    />
                  </>
                ) : (
                  <>
                    {task.taskApplications[0].status === "REJECTED" && (
                      <SecondaryButton
                        ariaLabel="delete-application"
                        text="Delete Application"
                        action={() =>
                          handleDeleteApplication(task.taskApplications[0].id)
                        }
                      />
                    )}
                    {task.taskApplications[0].status === "WITHDRAWN" && (
                      <>
                        <PrimaryButton
                          ariaLabel="reapply"
                          text="Re-apply for Task"
                          action={() =>
                            handleReapply(task.taskApplications[0].id)
                          }
                        />
                        <SecondaryButton
                          ariaLabel="delete-application"
                          text="Delete Application"
                          action={() =>
                            handleDeleteApplication(task.taskApplications[0].id)
                          }
                        />
                      </>
                    )}

                    {task.taskApplications[0].status === "PENDING" && (
                      <SecondaryButton
                        ariaLabel="withdraw"
                        text="Withdraw Application"
                        action={() =>
                          handleWithdrawApplication(task.taskApplications[0].id)
                        }
                      />
                    )}
                    {task.taskApplications[0].status === "ACCEPTED" && (
                      <SecondaryButton
                        ariaLabel="withdraw"
                        text="Withdraw Application"
                        action={() =>
                          handleWithdrawApplication(task.taskApplications[0].id)
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Comment Section with Toggle */}
          <div className="mt-8">
            {userRole.includes("volunteer") ? (
              task.taskApplications[0].status === "ACCEPTED" && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <SecondaryButton
                      ariaLabel="toggle-comments"
                      text={
                        isCommentsExpanded ? "Hide Comments" : "Show Comments"
                      }
                      action={() => setIsCommentsExpanded(!isCommentsExpanded)}
                    />
                  </div>
                  {isCommentsExpanded && (
                    <CommentSection
                      taskId={task.id}
                      currentUser={{
                        id: userId,
                        name: userName,
                      }}
                    />
                  )}
                </>
              )
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <SecondaryButton
                    ariaLabel="toggle-comments"
                    text={
                      isCommentsExpanded ? "Hide Comments" : "Show Comments"
                    }
                    action={() => setIsCommentsExpanded(!isCommentsExpanded)}
                  />
                </div>
                {isCommentsExpanded && (
                  <CommentSection
                    taskId={task.id}
                    currentUser={{
                      id: userId,
                      name: userName,
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
