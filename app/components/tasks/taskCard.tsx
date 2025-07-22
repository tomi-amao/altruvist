import { tasks } from "@prisma/client";
import { useState, useEffect } from "react";
import { Modal } from "../utils/Modal2";
import {
  CalendarBlank,
  Users,
  MapPin,
  Desktop,
  Buildings,
  GraduationCap,
  Coins,
  CheckCircle,
  Warning,
} from "@phosphor-icons/react";
import TaskDetailsCard from "./taskDetailsCard";
import { OnChainTaskData, EscrowAccountData } from "~/types/blockchain";
import { useSolanaService } from "~/hooks/useSolanaService";
import { address } from "@solana/kit";

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
  const [escrowInfo, setEscrowInfo] = useState<EscrowAccountData | null>(null);
  const [onChainTask, setOnChainTask] = useState<OnChainTaskData | null>(null);
  const [isLoadingEscrow, setIsLoadingEscrow] = useState(false);
  const { taskEscrowService } = useSolanaService();

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Load blockchain data when component mounts or task changes
  useEffect(() => {
    const getOnChainTask = async () => {
      if (!task.id || !task.rewardAmount || !taskEscrowService) return;

      try {
        setIsLoadingEscrow(true);
        const onChainTaskData = await taskEscrowService.getTaskInfo(
          task.id,
          task.creatorWalletAddress ||
            "GVv2rNjCVkbLd1kiqytZHNbxWVGwS8tsTcsiJmY6NxLQ",
        );

        if (onChainTaskData) {
          setOnChainTask(onChainTaskData);
          const escrowAccount = onChainTaskData.escrowAccount;

          if (escrowAccount) {
            const escrowData = await taskEscrowService.getEscrowInfo(
              address(escrowAccount.toString()),
            );
            if (escrowData) {
              setEscrowInfo({
                address: escrowData.address,
                data: escrowData.data,
                executable: escrowData.executable,
                exists: true,
                lamports: escrowData.lamports,
                programAddress: escrowData.programAddress,
                space: escrowData.space,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching on-chain task:", error);
      } finally {
        setIsLoadingEscrow(false);
      }
    };

    getOnChainTask();
  }, [task.id, task.rewardAmount, taskEscrowService]);

  // Format deadline to a more readable format
  const formattedDeadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No deadline";

  // Calculate days remaining until deadline
  const daysRemaining = task.deadline
    ? Math.ceil(
        (new Date(task.deadline).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
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

  // Format reward amount for display
  const rewardAmountFormatted = task.rewardAmount ? task.rewardAmount : null;

  // Check escrow status
  const hasBlockchainData = onChainTask || escrowInfo;
  const escrowStatus = onChainTask?.status?.created
    ? "Active"
    : onChainTask?.status
      ? Object.keys(onChainTask.status)[0]
      : null;

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
              <span className=" rounded-full px-3 py-1 text-xs font-semibold bg-basePrimaryDark text-baseSecondary flex items-center">
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

          {/* Reward Amount Display */}
          {rewardAmountFormatted && (
            <div className="mb-3 p-2 bg-basePrimary rounded-lg border border-baseSecondary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-baseSecondary" />
                  <span className="text-sm font-medium text-baseSecondary">
                    Reward: {rewardAmountFormatted} ALT
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isLoadingEscrow ? (
                    <div className="w-3 h-3 border border-baseSecondary/30 border-t-baseSecondary rounded-full animate-spin"></div>
                  ) : hasBlockchainData ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-confirmPrimary" />
                      <span className="text-xs text-confirmPrimary font-medium">
                        {escrowStatus || "Verified"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Warning className="h-3 w-3 text-accentPrimary" />
                      <span className="text-xs text-accentPrimary font-medium">
                        Pending
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                    <span className="mr-1">+{requiredSkills.length - 3}</span>
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
            resources={
              task.resources
                ?.filter(
                  (r) =>
                    r.name && r.extension && r.uploadURL && r.size !== null,
                )
                .map((r) => ({
                  name: r.name!,
                  extension: r.extension!,
                  uploadURL: r.uploadURL!,
                  size: r.size!,
                })) || []
            }
            userRole={task.userRole || []}
            volunteerDetails={
              task.volunteerDetails?.userId
                ? {
                    userId: task.volunteerDetails.userId,
                    taskApplications:
                      task.volunteerDetails.taskApplications || undefined,
                  }
                : undefined
            }
            taskApplications={task.taskApplications || []}
            location={task.location}
            rewardAmount={task.rewardAmount || undefined}
            creatorWalletAddress={task.creatorWalletAddress || undefined}
          />
        </Modal>
      )}
    </>
  );
}
