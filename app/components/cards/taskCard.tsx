import { tasks } from "@prisma/client";
import { CalendarIcon, PersonIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";
import { Modal } from "../utils/Modal2";

import { useFetcher } from "@remix-run/react";
import { SearchResultCardType } from "./searchResultCard";
import TaskDetailsCard from "./taskDetailsCard";

export const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case "HIGH":
      return "text-basePrimary bg-dangerPrimary";
    case "MEDIUM":
      return "text-baseSecondary bg-accentPrimary";
    case "LOW":
      return "text-basePrimary bg-basePrimaryLight";
    default:
      return "text-baseSecondary bg-basePrimaryLight";
  }
};
interface taskAdditionalDetails
  extends Omit<
    tasks,
    "createdAt" | "updatedAt" | "location" | "estimatedHours"
  > {
  userName: string;
  userRole: string[];
  charityName: string;
  volunteerDetails: volunteerDetails;
  taskApplications?: {
    id: string;
    status: string;
    userId: string;
  }[];
}

interface volunteerDetails {
  userId: string;
  taskApplications?: string[];
}
export default function TaskSummaryCard(task: taskAdditionalDetails) {
  const [showModal, setShowModal] = useState(false);
  const [showMessage, setShowMessage] = useState(true);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.data) {
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 3000); // 3 seconds

      return () => clearTimeout(timer); // Cleanup the timer on component unmount
    }
  }, [fetcher.data]);

  return (
    <>
      <button
        className="lg:w-[19rem] w-[20rem] rounded-xl shadow-md overflow-hidden  hover:shadow-xl bg-basePrimaryLight mt-2"
        onClick={() => {
          setShowModal(true);
        }}
      >
        <div className="px-8 py-6">
          <h2 className="font-semibold py-2 text-base">{task.title}</h2>
          <div className="flex items-center pb-2 gap-2 ">
            <span
              className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${getUrgencyColor(
                task.urgency || "LOW",
              )}`}
            >
              {task.urgency}
            </span>
            <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold text-basePrimaryDark bg-baseSecondary">
              {task.category[0]}
            </span>
          </div>

          <div className="flex flex-row items-center justify-start gap-2 pb-4">
            <div className="flex flex-row items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-baseSecondary" />
              <span>{task.deadline.toLocaleDateString()}</span>
            </div>

            {task.volunteersNeeded > 0 && (
              <div className="flex flex-row items-center">
                <PersonIcon className="h-5 w-5 mr-2 text-baseSecondary" />
                <span>{task.volunteersNeeded}</span>
              </div>
            )}
          </div>

          <div className="pb-4 text-left ">
            <p className="line-clamp-4  ">{task.description}</p>
          </div>

          <div className="flex flex-wrap items-center">
            {task.requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="inline-block bg-basePrimaryDark rounded-full px-3 py-1 text-xs font-semibold text-baseSecondary mr-2 mb-2"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </button>

      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <TaskDetailsCard
          category={task.category}
          charityName={task.charityName}
          charityId={task.charityId}
          id={task.id}
          description={task.description}
          title={task.title}
          impact={task.impact}
          requiredSkills={task.requiredSkills}
          urgency={task.urgency}
          volunteersNeeded={task.volunteersNeeded}
          deliverables={task.deliverables}
          deadline={new Date(task.deadline)}
          userId={task.userId}
          status={task.status}
          resources={task.resources}
          userRole={task.userRole}
          volunteerDetails={task.volunteerDetails}
          taskApplications={task.taskApplications || []}
        />
      </Modal>
    </>
  );
}

export const TaskSummaryCardMobile = (
  taskData: Omit<SearchResultCardType, "all" | "charities" | "tasks" | "users">,
) => {
  return (
    <>
      <button
        className="flex text-left items-center bg-basePrimaryDark rounded-md mb-2 hover:bg-basePrimaryLight w-full p-2"
        onClick={() => taskData.handleSelectedSearchItem(taskData.data)}
      >
        {/* mobile view component */}
        <div className="flex  text-left items-center m-auto  rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2  ">
          <div className="">
            <p className="font-semibold md:text-lg">{taskData.data.title}</p>
            <p className="text-xs md:text-sm mb-1">
              {taskData.data.description}
            </p>
            <ul className="flex gap-2  items-start flex-wrap">
              <li className="text-xs md:text-sm font-semibold">
                Urgency:
                <span
                  className={`  inline-block rounded-full px-2 md:px-2 md:py-[2px] ml-1 text-xs font-semibold ${getUrgencyColor(taskData.data.urgency || "LOW")}`}
                >
                  {taskData.data.urgency}
                </span>
              </li>
              {taskData.data.requiredSkills && (
                <li className="text-xs  md:text-sm font-semibold space-x-1">
                  Skills:
                  {taskData.data?.requiredSkills.map((skill) => (
                    <span className="rounded-sm font-semibold bg-basePrimaryLight px-1 text-[12px]">
                      {skill}
                    </span>
                  ))}
                </li>
              )}
              {
                <li className="text-xs flex-wrap md:text-sm font-semibold">
                  Deadline:
                  <span className="font-normal md:text-sm text-xs ">
                    {new Date(taskData.data.deadline).toLocaleDateString()}
                  </span>
                </li>
              }
              {taskData.data.category && (
                <li className="text-xs md:text-sm  font-semibold">
                  Tags:
                  <span className="font-normal md:text-sm text-xs">
                    {taskData.data?.category.map((tag) => (
                      <span className="rounded-sm font-semibold bg-basePrimaryLight px-1 text-[12px]">
                        {tag}
                      </span>
                    ))}
                  </span>
                </li>
              )}

              {taskData.data.deliverables && (
                <li className="text-xs md:text-sm hidden md:flex font-semibold">
                  Deliverable:
                  <span className="font-normal md:text-sm text-xs">
                    {taskData.data.deliverables[0]}
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
