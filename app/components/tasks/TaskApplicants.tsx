import { useState } from "react";
import { Link } from "react-router";
import { SecondaryButton } from "../utils/BasicButton";
import type {
  users,
  taskApplications,
  ApplicationStatus,
} from "@prisma/client";
import { CaretDown, UsersThree, Info, Wallet } from "@phosphor-icons/react";
import { useViewport } from "~/hooks/useViewport";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

interface TaskApplicantsProps {
  applicants: {
    application: taskApplications;
    user: users;
  }[];
  volunteersNeeded: number;
  acceptedCount: number;
  taskWalletAddress?: string | null; // Optional prop for task wallet address
  onAccept: (application: taskApplications) => void;
  onReject: (application: taskApplications) => void;
  onUndoStatus: (application: taskApplications) => void; // New prop for undoing status
}

export function TaskApplicants({
  applicants,
  volunteersNeeded,
  acceptedCount,
  taskWalletAddress,
  onAccept,
  onReject,
  onUndoStatus,
}: TaskApplicantsProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [optimisticStatuses, setOptimisticStatuses] = useState<
    Record<string, ApplicationStatus>
  >({});
  const { isMobile } = useViewport(); // Use the viewport hook
  const { connected, publicKey } = useWallet();

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAccept = (application: taskApplications) => {
    setOptimisticStatuses((prev) => ({
      ...prev,
      [application.id]: "ACCEPTED",
    }));
    onAccept(application);
  };

  const handleReject = (application: taskApplications) => {
    setOptimisticStatuses((prev) => ({
      ...prev,
      [application.id]: "REJECTED",
    }));
    onReject(application);
  };

  const handleUndoStatus = (application: taskApplications) => {
    setOptimisticStatuses((prev) => ({ ...prev, [application.id]: "PENDING" }));
    onUndoStatus(application);
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-confirmPrimary";
      case "REJECTED":
        return "bg-dangerPrimary";
      case "WITHDRAWN":
        return "bg-dangerPrimary";
      default:
        return "bg-baseSecondary";
    }
  };

  const getWalletValidationState = (application: taskApplications) => {
    // If no volunteer wallet address is required, no validation needed
    if (!application.volunteerWalletAddress) {
      return { isValid: true, message: null };
    }

    // Check if user has connected their wallet
    if (!connected || !publicKey) {
      return {
        isValid: false,
        message:
          "Please connect your wallet to accept applications with blockchain requirements",
      };
    }

    // Check if connected wallet matches the task wallet address
    if (taskWalletAddress && publicKey.toBase58() !== taskWalletAddress) {
      return {
        isValid: false,
        message:
          "You must connect the task creator wallet to accept blockchain applications",
      };
    }

    return { isValid: true, message: null };
  };

  const renderActionButtons = (application: taskApplications) => {
    const noSpotsLeft = volunteersNeeded - acceptedCount === 0;
    const currentStatus =
      optimisticStatuses[application.id] || application.status;
    const walletValidation = getWalletValidationState(application);
    const hasBlockchainRequirement = !!application.volunteerWalletAddress;

    switch (currentStatus) {
      case "ACCEPTED":
        return (
          <div
            className={`flex items-center ${isMobile ? "flex-col w-full" : "gap-2"}`}
          >
            <div className="flex items-center gap-2">
              <SecondaryButton
                text="Undo Accept"
                action={() => handleUndoStatus(application)}
                ariaLabel="undo accept status"
                isDisabled={
                  hasBlockchainRequirement && !walletValidation.isValid
                }
              />
              {hasBlockchainRequirement && !walletValidation.isValid && (
                <HoverCard>
                  <HoverCardTrigger>
                    <Info
                      size={16}
                      className="text-dangerPrimary cursor-help hover:text-dangerPrimary/80 transition-colors"
                      weight="fill"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto max-w-xs p-4 text-sm rounded-lg shadow-lg bg-baseSecondary/50 text-txt-secondary">
                    <div className="space-y-2">
                      <div className="text-dangerPrimary">
                        {walletValidation.message}
                      </div>
                      {!connected && (
                        <div className="text-txt-secondary/80">
                          No wallet connected
                        </div>
                      )}
                      {connected && publicKey && (
                        <div className="space-y-1">
                          <div className="text-txt-secondary/80">
                            Connected: {publicKey.toBase58().slice(0, 8)}...
                            {publicKey.toBase58().slice(-8)}
                          </div>
                          {taskWalletAddress && (
                            <div className="text-txt-secondary/80">
                              Required: {taskWalletAddress.slice(0, 8)}...
                              {taskWalletAddress.slice(-8)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          </div>
        );

      case "PENDING":
        if (noSpotsLeft) {
          return (
            <div className="text-baseSecondary text-sm italic">
              No spots available
            </div>
          );
        }
        return (
          <div className="space-y-3">
            <div
              className={`flex items-center ${isMobile ? "flex-col w-full gap-2" : "gap-2"}`}
            >
              <div className="flex items-center gap-2">
                <SecondaryButton
                  text="Accept"
                  action={() => handleAccept(application)}
                  ariaLabel="accept application"
                  isDisabled={
                    hasBlockchainRequirement && !walletValidation.isValid
                  }
                />
                {hasBlockchainRequirement && !walletValidation.isValid && (
                  <HoverCard>
                    <HoverCardTrigger>
                      <button>
                        <Info
                          size={16}
                          className="text-dangerPrimary cursor-help hover:text-dangerPrimary transition-colors"
                          weight="fill"
                        />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-auto max-w-xs p-4 text-sm rounded-lg shadow-lg bg-red-500 text-txt-secondary border border-dangerPrimary">
                      <div className="space-y-2">
                        {!connected && (
                          <div className="text-txt-secondary/80 font-semibold">
                            No wallet connected
                          </div>
                        )}
                        <div className="text-txt-secondary/80">
                          {walletValidation.message}
                        </div>
                        {connected && publicKey && (
                          <div className="space-y-1">
                            <div className="text-txt-secondary/80">
                              Connected: {publicKey.toBase58().slice(0, 8)}...
                              {publicKey.toBase58().slice(-8)}
                            </div>
                            {taskWalletAddress && (
                              <div className="text-txt-secondary/80">
                                Required: {taskWalletAddress.slice(0, 8)}...
                                {taskWalletAddress.slice(-8)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
              <SecondaryButton
                text="Reject"
                action={() => handleReject(application)}
                ariaLabel="reject application"
              />
            </div>
            {hasBlockchainRequirement && walletValidation.isValid && (
              <div className="flex items-center gap-2 text-xs text-confirmPrimary">
                <span>
                  <Wallet size={20} className="text-confirmPrimary" /> Wallet
                  Connected & Verified
                </span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Transform the data and apply optimistic updates
  const applicantsWithData = applicants.map(({ application, user }) => ({
    application: {
      ...application,
      status: optimisticStatuses[application.id] || application.status,
    },
    userData: user,
  }));

  return (
    <div
      className="bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 backdrop-blur-sm
                     border border-baseSecondary/10 transition-all duration-300 rounded-lg p-6"
    >
      <div
        className={`flex ${isMobile ? "flex-col gap-3" : "justify-between"} items-center mb-6`}
      >
        <div className="flex items-center gap-2">
          <UsersThree
            size={24}
            className="text-baseSecondary/70"
            weight="thin"
          />
          <h3
            id="applicants-heading"
            className="text-base font-semibold tracking-wide text-baseSecondary"
          >
            Applicants
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-baseSecondary">Spots remaining:</span>
          <span className="px-3 py-1 rounded-full bg-baseSecondary text-basePrimaryLight">
            {volunteersNeeded - acceptedCount}
          </span>
        </div>
      </div>

      {applicantsWithData.length === 0 ? (
        <p className="text-baseSecondary text-center py-4">No applicants yet</p>
      ) : (
        <ul className="space-y-4">
          {applicantsWithData.map(({ application, userData }) => (
            <li
              key={application.id}
              className="border border-baseSecondary bg-gradient-to-br from-basePrimary/70 to-basePrimary/80 rounded-lg overflow-hidden"
            >
              <div className="p-4">
                <div
                  className={`flex items-center ${isMobile ? "flex-col gap-2" : "justify-between"}`}
                >
                  <button
                    onClick={() => toggleExpand(application.id)}
                    className={`flex items-center gap-2 text-baseSecondary hover:text-baseSecondary/80 ${isMobile ? "w-full justify-between" : ""}`}
                  >
                    <span className="font-semibold truncate">
                      {userData.name}
                    </span>
                    <CaretDown
                      size={20}
                      className={`transform transition-transform ${
                        expandedIds.includes(application.id) ? "rotate-180" : ""
                      }`}
                      weight="thin"
                    />
                  </button>
                  <span
                    className={`px-3 py-1 rounded-full text-basePrimaryLight ${getStatusColor(application.status)} ${isMobile ? "self-start" : ""}`}
                    data-testid="application-status"
                  >
                    {application.status}
                  </span>
                </div>

                {expandedIds.includes(application.id) && (
                  <div className="mt-4 space-y-4">
                    {/* User Title/Role */}
                    <div>
                      <p className="text-baseSecondary break-words">
                        {userData.userTitle}
                      </p>
                    </div>

                    {/* Skills */}
                    <div>
                      <h3 className="text-sm font-semibold text-baseSecondary mb-2">
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {userData.skills?.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-basePrimaryDark text-baseSecondary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Application Message if exists */}
                    {application.message && (
                      <div>
                        <h3 className="text-sm font-semibold text-baseSecondary mb-2">
                          Message
                        </h3>
                        <p className="text-baseSecondary text-sm break-words">
                          {application.message}
                        </p>
                      </div>
                    )}

                    {/* Profile Link */}
                    <div>
                      <Link
                        to={`/profile/${userData.id}`}
                        className="text-baseSecondary hover:underline text-sm"
                      >
                        View Profile
                      </Link>
                    </div>

                    {/* Action Buttons */}
                    <div
                      className={`${isMobile ? "w-full" : "flex gap-2"} pt-2`}
                    >
                      {renderActionButtons(application)}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
