import { tasks } from "@prisma/client";
import { useState } from "react";
import { Modal } from "../utils/Modal2";
import {
  CalendarBlank,
  Users,
  MapPin,
  Desktop,
  Buildings,
  GraduationCap,
} from "@phosphor-icons/react";
import { SearchResultCardType } from "../cards/searchResultCard";
import TaskDetailsCard from "./taskDetailsCard";

export const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case "HIGH":
      return "text-basePrimary bg-dangerPrimary";
    case "MEDIUM":
      return "text-baseSecondary bg-accentPrimary";
    case "LOW":
      return "text-baseSecondary bg-basePrimaryDark";
    default:
      return "text-baseSecondary bg-basePrimaryDark";
  }
};

// Add a function to get color based on task status
export const getStatusColor = (status: string | null) => {
  switch (status) {
    case "COMPLETED":
      return "bg-indicator-green text-darkGrey border-indicator-green";
    case "IN_PROGRESS":
      return "bg-indicator-blue text-darkGrey border-indicator-blue";
    case "INCOMPLETE":
      return "bg-indicator-yellow text-darkGrey border-indicator-yellow";
    case "CANCELLED":
      return "bg-dangerPrimary text-darkGrey border-dangerPrimary";
    case "NOT_STARTED":
      return "bg-indicator-orange text-darkGrey border-indicator-orange";
    default:
      return "bg-basePrimaryDark text-baseSecondary";
  }
};

interface taskAdditionalDetails
  extends Omit<
    tasks,
    "createdAt" | "updatedAt" | "location" | "estimatedHours"
  > {
  userName: string;
  userRole: string[] | undefined;
  charityName: string;
  volunteerDetails: volunteerDetails;
  taskApplications?: {
    id: string;
    status: string;
    userId: string;
  }[];
  location?: {
    address: string;
  };
}

interface volunteerDetails {
  userId: string | undefined;
  taskApplications?: string[] | null;
}

export default function TaskSummaryCard(task: taskAdditionalDetails) {
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Format deadline to a more readable format
  const formattedDeadline = task.deadline ? new Date(task.deadline).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ) : "No deadline";

  // Calculate days remaining until deadline
  const daysRemaining = task.deadline 
    ? Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const deadlineClass =
    daysRemaining < 7 ? "text-dangerPrimary font-medium" : "";

  // Determine if task is remote or InPerson
  const isInPerson = task.location ? true : false;

  // Safely accessing properties with null checks
  const volunteersNeeded = task.volunteersNeeded || 0;
  const requiredSkills = task.requiredSkills || [];
  const category = task.category || [];
  const status = task.status || "NOT_STARTED";
  const urgency = task.urgency || "LOW";

  return (
    <>
      <button
        className="lg:w-[19rem] w-[20rem] rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-basePrimaryLight mt-2 border border-basePrimaryLight hover:border-baseSecondary"
        onClick={() => {
          setShowModal(true);
        }}
      >
        <div className="px-6 py-5 flex flex-col h-full">
          {/* Header with title and urgency badge */}
          <div className="mb-3">
            <h2 className="font-bold text-lg mb-2 text-left line-clamp-2">
              {task.title || "Untitled Task"}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getUrgencyColor(
                  urgency,
                )}`}
              >
                {urgency} PRIORITY
              </span>
              {category.length > 0 && (
                <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-basePrimaryDark bg-baseSecondary">
                  {category[0]}
                </span>
              )}
              {/* Remote/InPerson badge */}
              <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-basePrimaryDark text-baseSecondary flex items-center">
                {isInPerson ? (
                  <>
                    <MapPin className="h-3 w-3 mr-1" weight="fill" />
                    InPerson
                  </>
                ) : (
                  <>
                    <Desktop className="h-3 w-3 mr-1" weight="fill" />
                    REMOTE
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Description - limited to 3 lines */}
          <div className="mb-3 text-left">
            <p className="line-clamp-3 text-sm opacity-90">
              {task.description || "No description provided"}
            </p>
          </div>

          {/* Key information section */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div className="flex items-center col-span-1">
              <CalendarBlank className="h-4 w-4 mr-1.5 text-baseSecondary" />
              <span className={deadlineClass}>{formattedDeadline}</span>
            </div>

            {volunteersNeeded > 0 && (
              <div className="flex items-center col-span-1">
                <Users className="h-4 w-4 mr-1.5 text-baseSecondary" />
                <span>
                  {volunteersNeeded} volunteer
                  {volunteersNeeded !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Display location if InPerson */}
            {isInPerson && task.location && (
              <div className="flex items-center col-span-2 text-xs mt-1">
                <MapPin className="h-4 w-4 mr-1.5 text-baseSecondary" />
                <span className="truncate py-[1px]">
                  {task.location.address}
                </span>
              </div>
            )}

            {task.charityName && (
              <div className="flex items-center col-span-2 text-xs mt-1">
                <Buildings className="h-4 w-4 mr-1.5 text-baseSecondary" />
                <span className="truncate py-1">{task.charityName}</span>
              </div>
            )}
          </div>

          {/* Improved Skills section */}
          {requiredSkills.length > 0 && (
            <div className="mt-auto pt-2 border-t border-baseSecondary/20">
              <div className="text-xs font-medium mb-2 text-left flex items-center">
                <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-baseSecondary" />
                <span className="text-baseSecondary">Skills Required:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.slice(0, 3).map((skill, index) => (
                  <div
                    key={`${task.id}-skill-${index}`}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-baseSecondary border border-baseSecondary/20 shadow-sm"
                  >
                    {skill}
                  </div>
                ))}
                {requiredSkills.length > 3 && (
                  <div className="rounded-md px-2.5 py-1 text-xs font-medium text-baseSecondary border border-baseSecondary/20 shadow-sm flex items-center">
                    <span className="mr-1">
                      +{requiredSkills.length - 3}
                    </span>
                    <span className="text-[10px] opacity-80">more</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status indicator if available */}
          {status && (
            <div className="text-right mt-3">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-md ${getStatusColor(status)}`}
              >
                {status.replace("_", " ")}
              </span>
            </div>
          )}
        </div>
      </button>

      {showModal && (
        <Modal isOpen={showModal} onClose={handleCloseModal}>
          <TaskDetailsCard
            category={category}
            charityName={task.charityName || ""}
            charityId={task.charityId}
            id={task.id}
            description={task.description || ""}
            title={task.title || "Untitled Task"}
            impact={task.impact || ""}
            requiredSkills={requiredSkills}
            urgency={urgency}
            volunteersNeeded={volunteersNeeded}
            deliverables={task.deliverables || []}
            deadline={task.deadline ? new Date(task.deadline) : new Date()}
            userId={task.userId || ""}
            status={status}
            resources={task.resources || []}
            userRole={task.userRole || []}
            volunteerDetails={task.volunteerDetails}
            taskApplications={task.taskApplications || []}
            location={task.location}
          />
        </Modal>
      )}
    </>
  );
}

export const TaskSummaryCardMobile = (
  taskData: Omit<SearchResultCardType, "all" | "charities" | "tasks" | "users">,
) => {
  // Ensure the data exists and has the expected properties
  const data = taskData.data || {};
  const title = data.title || "Untitled Task";
  const description = data.description || "No description";
  const urgency = data.urgency || "LOW";
  const requiredSkills = Array.isArray(data.requiredSkills) ? data.requiredSkills : [];
  const category = Array.isArray(data.category) ? data.category : [];
  const deliverables = Array.isArray(data.deliverables) ? data.deliverables : [];
  const deadline = data.deadline ? new Date(data.deadline) : new Date();

  return (
    <>
      <button
        className="flex text-left items-center bg-basePrimaryDark rounded-md mb-2 hover:bg-basePrimaryLight w-full p-2"
        onClick={() => taskData.handleSelectedSearchItem && taskData.handleSelectedSearchItem(data)}
      >
        {/* mobile view component */}
        <div className="flex text-left items-center m-auto rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2">
          <div className="">
            <p className="font-semibold md:text-lg">{title}</p>
            <p className="text-xs md:text-sm mb-1">
              {description}
            </p>
            <ul className="flex gap-2 items-start flex-wrap">
              <li className="text-xs md:text-sm font-semibold">
                Urgency:
                <span
                  className={`inline-block rounded-full px-2 md:px-2 md:py-[2px] ml-1 text-xs font-semibold ${getUrgencyColor(urgency)}`}
                >
                  {urgency}
                </span>
              </li>
              {requiredSkills.length > 0 && (
                <li className="text-xs md:text-sm font-semibold space-x-1">
                  Skills:
                  {requiredSkills.map((skill, index) => (
                    <span
                      key={`${data.id || 'task'}-skill-${index}`}
                      className="rounded-sm font-semibold bg-basePrimaryLight px-1 text-[12px]"
                    >
                      {skill}
                    </span>
                  ))}
                </li>
              )}
              <li className="text-xs flex-wrap md:text-sm font-semibold">
                Deadline:
                <span className="font-normal md:text-sm text-xs">
                  {deadline.toLocaleDateString()}
                </span>
              </li>
              {category.length > 0 && (
                <li className="text-xs md:text-sm font-semibold">
                  Tags:
                  <span className="font-normal md:text-sm text-xs">
                    {category.map((tag, index) => (
                      <span
                        key={`${data.id || 'task'}-tag-${index}`}
                        className="rounded-sm font-semibold bg-basePrimaryLight px-1 text-[12px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                </li>
              )}
              {deliverables.length > 0 && (
                <li className="text-xs md:text-sm hidden md:flex font-semibold">
                  Deliverable:
                  <span className="font-normal md:text-sm text-xs">
                    {deliverables[0]}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </button>
    </>
  );
};
