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
import {
  Files,
  Info,
  Lightbulb,
  ListChecks,
  NotePencil,
  Tag,
  Target,
} from "phosphor-react";
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
  uploadURL: string;
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
  uploadURL,
}: TaskDetailsProps) {
  const fetcher = useFetcher();
  const [formData, setFormData] = useState<tasks>(task);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

  const handleAcceptApplication = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "acceptTaskApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
        userId: userId ?? null,
        taskId: task.id,
      },
      { method: "POST" },
    );
  };

  const handleRejectApplication = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "rejectTaskApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
        userId: userId ?? null,
        taskId: task.id,
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
    if (!applicationId) return;

    fetcher.submit(
      {
        _action: "deleteApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
        userId: userId ?? null,
        taskId: task.id,
      },
      { method: "POST" },
    );
  };

  const handleReapply = (applicationId: string) => {
    if (!applicationId) return;

    fetcher.submit(
      {
        _action: "undoApplicationStatus",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
        userId: userId ?? null,
        taskId: task.id,
      },
      { method: "POST" },
    );
  };

  const handleWithdrawApplication = (applicationId: string) => {
    if (!applicationId) return;

    fetcher.submit(
      {
        _action: "withdrawApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
      },
      { method: "POST" },
    );
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
      <span
        className={`inline-block w-2 h-2 rounded-full ${colorClass}`}
      ></span>
    );
  };

  return (
    <div className="bg-basePrimary rounded-lg shadow-lg p-3 sm:p-4 md:p-6 lg:border border-baseSecondary">
      {/* Error message section */}
      {isError && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 lg:p-4 bg-dangerPrimary/10 border border-dangerPrimary rounded-lg">
          <span className="text-dangerPrimary text-sm sm:text-base">
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
          onCancel={() => setIsEditing?.(false)}
          isEditing={true}
          error={error}
          uploadURL={uploadURL}
          serverValidation={[]}
          isSubmitting={false}
        />
      ) : (
        <div className="max-w-7xl mx-auto mt-3 sm:mt-5">
          {/* Header Section with Key Info */}
          <div className="bg-basePrimaryLight rounded-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 relative overflow-hidden transform transition-all duration-300 hover:shadow-lg">
            {/* Priority Badge with enhanced visibility and animation */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 transform transition-transform duration-300 hover:scale-105 z-10">
              <span
                className={`inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium
                  shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg
                  ${
                    displayData.urgency === "HIGH"
                      ? "bg-dangerPrimary text-basePrimaryLight"
                      : displayData.urgency === "MEDIUM"
                        ? "bg-accentPrimary text-baseSecondary"
                        : "bg-confirmPrimary text-basePrimaryLight"
                  }`}
              >
                <span className="h-1.5 sm:h-2 w-1.5 sm:w-2 -ml-1 sm:-ml-2 rounded-full animate-pulse"></span>
                {displayData.urgency?.toLowerCase()} priority
              </span>
            </div>

            <div className="space-y-4 sm:space-y-8">
              {/* Impact Statement with enhanced visual treatment */}
              <div
                className="relative p-3 sm:p-6 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 backdrop-blur-sm
                     border border-baseSecondary/10 transition-all duration-300 hover:border-baseSecondary/20"
              >
                <h3
                  className="text-sm sm:text-base font-semibold tracking-wider text-baseSecondary mb-2 sm:mb-3
                   flex items-center gap-1 sm:gap-2"
                >
                  <Target
                    size={18}
                    weight="regular"
                    className="text-baseSecondary/70"
                  />
                  Impact
                </h3>
                <p
                  className="text-baseSecondary text-sm sm:text-base md:text-lg leading-relaxed font-light
                     [text-wrap:balance] tracking-wide"
                >
                  {displayData.impact}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Description Section */}
              <section
                className="bg-basePrimaryLight rounded-xl p-4 sm:p-6 md:p-8 transition-all duration-300 hover:shadow-lg"
                aria-labelledby="task-description-heading"
              >
                <div
                  className="relative p-3 sm:p-6 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 
                  backdrop-blur-sm border border-baseSecondary/10 transition-all duration-300 
                  hover:border-baseSecondary/20 hover:bg-gradient-to-br hover:from-basePrimary/10 hover:to-basePrimary/15"
                >
                  <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-4">
                    <NotePencil
                      size={18} 
                      weight="regular"
                      className="text-baseSecondary/70"
                    />
                    <h3
                      id="task-description-heading"
                      className="text-sm sm:text-base font-semibold tracking-wider text-baseSecondary"
                    >
                      About this task
                    </h3>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-2 sm:-left-3 top-0 bottom-0 w-0.5 sm:w-1 bg-baseSecondary/10 rounded-full"></div>
                    <p
                      className="text-baseSecondary text-sm sm:text-base md:text-lg leading-relaxed font-light tracking-wide
                    [text-wrap:balance] pl-2 sm:pl-4 transition-all duration-300 group-hover:text-baseSecondary/90"
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
                    className="bg-basePrimaryLight rounded-xl p-4 sm:p-6 md:p-8 transition-all duration-300 hover:shadow-lg"
                    aria-labelledby="deliverables-heading"
                  >
                    <div
                      className="relative p-3 sm:p-6 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 
                      backdrop-blur-sm border border-baseSecondary/10 transition-all duration-300 
                      hover:border-baseSecondary/20"
                    >
                      <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-4">
                        <ListChecks
                          size={18}
                          weight="regular"
                          className="text-baseSecondary/70"
                        />
                        <h3
                          id="deliverables-heading"
                          className="text-sm sm:text-base font-semibold tracking-wider text-baseSecondary"
                        >
                          Key Deliverables
                        </h3>
                      </div>

                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                        {displayData.deliverables.map((deliverable, index) => (
                          <li
                            key={index}
                            className="group relative p-2 sm:p-4 bg-basePrimary rounded-lg border border-baseSecondary/10
                              transition-all duration-300 hover:border-baseSecondary/20 hover:shadow-sm"
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              <span
                                className="w-5 h-5 sm:w-6 sm:h-6 bg-baseSecondary text-basePrimary rounded-full 
                                flex items-center justify-center flex-shrink-0 font-medium text-xs sm:text-sm
                                 group-hover:scale-110 transition-all duration-300"
                              >
                                {index + 1}
                              </span>
                              <span
                                className="text-baseSecondary text-sm sm:text-base leading-relaxed [text-wrap:balance]
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
                  className="bg-basePrimaryLight rounded-xl p-4 sm:p-6 md:p-8 transition-all duration-300 hover:shadow-lg"
                  aria-labelledby="resources-heading"
                >
                  <div
                    className="relative p-3 sm:p-6 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 
                    backdrop-blur-sm border border-baseSecondary/10 transition-all duration-300 
                    hover:border-baseSecondary/20"
                  >
                    <div className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-6">
                      <Files
                        size={18}
                        weight="regular"
                        className="text-baseSecondary/70"
                      />
                      <h2
                        id="resources-heading"
                        className="text-sm sm:text-base font-semibold tracking-wide text-baseSecondary"
                      >
                        Resources & Materials
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                      {displayData.resources.map((resource, index) => (
                        <div key={index} className="relative">
                          <FilePreviewButton
                            fileName={resource.name}
                            fileSize={resource.size}
                            fileUrl={resource.uploadURL}
                            fileExtension={resource.extension}
                            isEditing={false}
                          />
                        </div>
                      ))}
                    </div>

                    {displayData.resources.length === 0 && (
                      <p className="text-baseSecondary/70 text-center py-2 sm:py-4 text-sm sm:text-base">
                        No resources available for this task
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Stats Card */}
              <div className="bg-basePrimaryLight rounded-xl p-4 sm:p-6 md:p-8">
                <div
                  className="bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 rounded-xl p-3 sm:p-6 backdrop-blur-sm
                  border border-baseSecondary/10 transition-all duration-300 hover:border-baseSecondary/20"
                >
                  {/* Header */}

                  <div className="space-y-4 sm:space-y-8">
                    {/* Team Size Card */}
                    <div
                      className="group relative overflow-hidden bg-basePrimary rounded-lg p-3 sm:p-5 
                    transition-all duration-300 hover:shadow-md"
                    >
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-accentPrimary/5 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                      <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-baseSecondary/70 mb-1 sm:mb-2">
                        Team Size
                      </h3>
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-baseSecondary">
                          {displayData.volunteersNeeded}
                        </span>
                        <span className="text-sm sm:text-base text-baseSecondary/80">
                          volunteer
                          {displayData.volunteersNeeded !== 1 ? "s" : ""} needed
                        </span>
                      </div>
                    </div>

                    {/* Required Skills Section */}
                    <div>
                      <h3
                        className="text-xs sm:text-sm font-medium uppercase tracking-wider text-baseSecondary/70 mb-2 sm:mb-4
                      flex items-center gap-1 sm:gap-2"
                      >
                        <Lightbulb
                          size={18}
                          weight="regular"
                          className="text-baseSecondary/70"
                        />
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {requiredSkills.length > 0 ? (
                          requiredSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-basePrimary px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm text-baseSecondary
                        border border-baseSecondary/10 transition-all duration-300
                        hover:border-baseSecondary/20 hover:shadow-sm hover:scale-105
                        flex items-center gap-1 sm:gap-2"
                            >
                              {listDotStyling(skill)}
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-baseSecondary/60 text-xs sm:text-sm italic">
                            No specific skills required
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  {displayData.category && displayData.category.length > 0 && (
                    <div className="mt-4 sm:mt-8">
                      <h3
                        className="text-xs sm:text-sm font-medium uppercase tracking-wider text-baseSecondary/70 mb-2 sm:mb-4
                        flex items-center gap-1 sm:gap-2"
                      >
                        <Tag
                          size={18}
                          weight="regular"
                          className="text-baseSecondary/70"
                        />
                        Categories
                      </h3>

                      <div
                        className="flex flex-wrap gap-1.5 sm:gap-2"
                        aria-label="Task categories"
                      >
                        {displayData.category.map((cat, index) => (
                          <span
                            key={index}
                            className="group relative bg-basePrimary px-2 sm:px-4 py-1 sm:py-2 rounded-lg 
                              border border-baseSecondary/10 transition-all duration-300
                              hover:border-baseSecondary/20 hover:shadow-sm
                              flex items-center gap-1 sm:gap-2"
                          >
                            {listDotStyling(cat)}

                            <span
                              className="text-xs sm:text-sm font-medium text-baseSecondary/80 
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
                    <div className="mt-4 sm:mt-8">
                      <h3
                        className="text-xs sm:text-sm font-medium uppercase tracking-wider text-baseSecondary/70 mb-2 sm:mb-4
                        flex items-center gap-1 sm:gap-2"
                      >
                        <Info
                          size={18}
                          weight="regular"
                          className="text-baseSecondary/70"
                        />
                        Task Status
                      </h3>

                      <DropdownField
                        htmlFor="urgency"
                        value={formData.status || ''}
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

              {/* Action Buttons - Make sticky on mobile */}
              <div className="sticky bottom-0 sm:relative bg-basePrimaryLight rounded-xl p-3 sm:p-6 space-y-2 sm:space-y-3 z-10">
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
                    {task.applications?.length > 0 && task.applications[0]?.application?.status === "REJECTED" && (
                      <SecondaryButton
                        ariaLabel="delete-application"
                        text="Delete Application"
                        action={() =>
                          handleDeleteApplication(task.applications[0].application.id)
                        }
                      />
                    )}
                    {task.applications?.length > 0 && task.applications[0]?.application?.status === "WITHDRAWN" && (
                      <>
                        <PrimaryButton
                          ariaLabel="reapply"
                          text="Re-apply for Task"
                          action={() =>
                            handleReapply(task.applications[0].application.id)
                          }
                        />
                        <SecondaryButton
                          ariaLabel="delete-application"
                          text="Delete Application"
                          action={() =>
                            handleDeleteApplication(task.applications[0].application.id)
                          }
                        />
                      </>
                    )}

                    {task.applications?.length > 0 && task.applications[0]?.application?.status === "PENDING" && (
                      <SecondaryButton
                        ariaLabel="withdraw"
                        text="Withdraw Application"
                        action={() =>
                          handleWithdrawApplication(task.applications[0].application.id)
                        }
                      />
                    )}
                    {task.applications?.length > 0 && task.applications[0]?.application?.status === "ACCEPTED" && (
                      <SecondaryButton
                        ariaLabel="withdraw"
                        text="Withdraw Application"
                        action={() =>
                          handleWithdrawApplication(task.applications[0].application.id)
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Comment Section with Toggle */}
          <div className="mt-4 sm:mt-8">
            {userRole.includes("volunteer") ? (
              task.applications?.length > 0 && task.applications[0]?.application?.status === "ACCEPTED" && (
                <>
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
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
                        id: userId || '',
                        name: userName || '',
                        email: '',
                        profilePicture: null,
                        charityId: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        userTitle: null,
                        zitadelId: '',
                        skills: [],
                        preferredCharities: [],
                        hourlyRate: null,
                        permissions: []
                      }}
                    />
                  )}
                </>
              )
            ) : (
              <>
                <div className="flex items-center justify-between mb-2 sm:mb-4">
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
                      id: userId || '',
                      name: userName || '',
                      email: '',
                      profilePicture: null,
                      charityId: null,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      userTitle: null,
                      zitadelId: '',
                      skills: [],
                      preferredCharities: [],
                      hourlyRate: null,
                      permissions: []
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
