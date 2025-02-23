import { Link } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import { Modal } from "../utils/Modal2";
import TaskDetailsCard from "../tasks/taskDetailsCard";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  category: string[];
  charity?: {
    name: string;
  };
  urgency: "HIGH" | "MEDIUM" | "LOW";
  _count: {
    taskApplications: number;
  };
  popularityScore: number;
}

export default function PopularTasks({ tasks }: { tasks: Task[] }) {
  return (
    <>
      <div className="bg-basePrimaryDark rounded-md p-2 m-2 shadow-lg">
        <div className="p-4 flex flex-row justify-between border-y-baseSecondary border-b-[1px] items-center">
          <span>Popular Tasks</span>
          <Link
            to="/explore"
            className="text-midGrey text-xs hover:text-baseSecondary"
          >
            See more
          </Link>
        </div>
        {tasks.map((task) => (
          <LatestTaskSummary key={task.id} task={task} />
        ))}
      </div>
    </>
  );
}

export function LatestTaskSummary({ task }: { task: Task }) {
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
  };
  const handleModal = () => {
    setShowModal((preValue) => !preValue);
  };
  const timeAgo = formatDistanceToNow(new Date(task.createdAt), {
    addSuffix: true,
  });

  return (
    <>
      <button
        className="w-full text-left cursor-pointer rounded-md p-4 flex flex-col hover:bg-basePrimary transition-colors"
        onClick={() => handleModal()}
      >
        <p className="font-bold font-primary">
          {task.category[0] || "Uncategorized"}
        </p>
        <p className="text-midGrey text-sm line-clamp-2">{task.description}</p>
        <div className="flex flex-row justify-between items-center py-2 text-xs">
          <div className="flex flex-row gap-2 items-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-txtprimary opacity-25"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-txtprimary"></span>
            </span>
            <span className="text-midGrey font-primary">
              {task.charity?.name || "Task"}
            </span>
            {task.urgency === "HIGH" && (
              <span className="bg-dangerPrimary text-basePrimaryLight px-2 py-0.5 rounded-full text-xs">
                Urgent
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>{`${task._count.taskApplications} ${task._count.taskApplications === 1 ? "applicant" : "applicants"}`}</span>
            <span>•</span>
            <span>{timeAgo}</span>
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
