import { tasks } from "@prisma/client";
import { CalendarIcon, PersonIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Modal } from "../utils/Modal2";
import DashboardBanner from "./BannerSummaryCard";
import { PrimaryButton, SecondaryButton } from "../utils/BasicButton";
import { useFetcher } from "@remix-run/react";

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
  charityName: string;
}
export default function TaskSummaryCard(task: taskAdditionalDetails) {
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const taskFiles = ["PDF", "PNG", "EXCEL"];

  const fetcher = useFetcher();

  const handleApply = (taskId: string, charityId: string) => {
    fetcher.submit(
      { taskId, charityId },
      { method: "post", action: "/api/apply-for-task" },
    );
    return {};
  };

  return (
    <>
      <button
        className="lg:w-[19rem] w-[20rem] rounded-xl shadow-md overflow-hidden  hover:shadow-2xl"
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

          <div className="pb-4 text-left">
            {" "}
            <p>{task.description}</p>
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
        <div className="bg-basePrimary shadow-lg w-fit ">
          <DashboardBanner
            bannerItems={[
              { title: "Title", value: task.title },
              { title: "Deadline", value: task.deadline.toLocaleDateString() },
              ...(task.charityId
                ? [{ title: "Charity", value: task.charityName }]
                : [{ title: "Creator", value: task.userName }]),

              { title: "Category", value: task.category[0] },
            ]}
          />
        </div>
        <div className="p-4 bg-basePrimary mt-2 rounded-lg shadow-lg border border-baseSecondary">
          <h1 className="text-base font-primary font-semibold py-2 ">
            Description
          </h1>
          <p className=" font-primary  ">{task.description}</p>
          <h1 className="text-base font-primary mt-2 font-semibold py-2 ">
            Impact
          </h1>
          <p className=" font-primary  ">{task.impact}</p>
          <h1 className="text-base font-primary font-semibold mt-2 py-2 ">
            Key Deliverables
          </h1>
          <p className=" font-primary px-3 ">
            {task.deliverables.map((item, index) => (
              <li key={index}> {item}</li>
            ))}
          </p>
          <h1 className="text-base font-primary font-semibold mt-2 py-2 ">
            Urgency
          </h1>
          <span
            className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${getUrgencyColor(
              task.urgency || "LOW",
            )}`}
          >
            {" "}
            {task.urgency}
          </span>
          <h1 className="text-base font-primary font-semibold py-2 mt-2 ">
            Required Skills
          </h1>
          {task.requiredSkills.map((skill, index) => (
            <span
              key={index}
              className="inline-block bg-basePrimaryDark rounded-full px-3 py-1 text-xs font-semibold text-baseSecondary mr-2 mb-2"
            >
              {skill}
            </span>
          ))}
          <h1 className="text-base font-primary font-semibold py-2  mt-2">
            {" "}
            Attachments
          </h1>
          <div className="flex gap-4 mt-2">
            {taskFiles.map((file, index) => (
              <SecondaryButton text={file} ariaLabel={file} key={index} />
            ))}
          </div>
          <h1 className="text-base font-primary font-semibold py-2 mt-2 ">
            Status
          </h1>
          <span className="font-primary bg-baseSecondary text-basePrimary p-2 px-4 rounded-md">
            {task.status}
          </span>
          <div className="mt-4 m-auto w-fit flex gap-4 ">
            <button className="font-primary text-sm text-baseSecondary">
              {" "}
              View Charity
            </button>
            <PrimaryButton
              text="Volunteer"
              ariaLabel="volunteer for task"
              action={() => handleApply(task.id, task.charityId || "")}
            />
            <button className="font-primary text-sm text-baseSecondary">
              {" "}
              Message
            </button>
          </div>

          {/* <button onClick={handleCloseModal} className="px-4 py-2 ">
            Close
          </button> */}
        </div>
      </Modal>
    </>
  );
}
