import { useState } from "react";
import { Link } from "@remix-run/react";
import { SecondaryButton } from "../utils/BasicButton";
import type {
  users,
  taskApplications,
  ApplicationStatus,
} from "@prisma/client";
import { CaretDown, UsersThree } from "@phosphor-icons/react";
import { useViewport } from "~/hooks/useViewport"; // Import useViewport hook

interface TaskApplicantsProps {
  applicants: {
    application: taskApplications;
    user: users;
  }[];
  volunteersNeeded: number;
  acceptedCount: number;
  onAccept: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
  onRemoveVolunteer: (applicationId: string) => void;
  onUndoStatus: (applicationId: string) => void; // New prop for undoing status
}

export function TaskApplicants({
  applicants,
  volunteersNeeded,
  acceptedCount,
  onAccept,
  onReject,
  onUndoStatus,
}: TaskApplicantsProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [optimisticStatuses, setOptimisticStatuses] = useState<
    Record<string, ApplicationStatus>
  >({});
  const { isMobile } = useViewport(); // Use the viewport hook

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAccept = (applicationId: string) => {
    setOptimisticStatuses((prev) => ({ ...prev, [applicationId]: "ACCEPTED" }));
    onAccept(applicationId);
  };

  const handleReject = (applicationId: string) => {
    setOptimisticStatuses((prev) => ({ ...prev, [applicationId]: "REJECTED" }));
    onReject(applicationId);
  };

  const handleUndoStatus = (applicationId: string) => {
    setOptimisticStatuses((prev) => ({ ...prev, [applicationId]: "PENDING" }));
    onUndoStatus(applicationId);
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

  const renderActionButtons = (application: taskApplications) => {
    const noSpotsLeft = volunteersNeeded - acceptedCount === 0;
    const currentStatus =
      optimisticStatuses[application.id] || application.status;

    switch (currentStatus) {
      case "ACCEPTED":
        return (
          <div className={`flex ${isMobile ? "flex-col w-full" : "gap-2"}`}>
            <SecondaryButton
              text="Undo Accept"
              action={() => handleUndoStatus(application.id)}
              ariaLabel="undo accept status"
            />
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
          <div
            className={`flex ${isMobile ? "flex-col w-full gap-2" : "gap-2"}`}
          >
            <SecondaryButton
              text="Accept"
              action={() => handleAccept(application.id)}
              ariaLabel="accept application"
            />
            <SecondaryButton
              text="Reject"
              action={() => handleReject(application.id)}
              ariaLabel="reject application"
            />
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
