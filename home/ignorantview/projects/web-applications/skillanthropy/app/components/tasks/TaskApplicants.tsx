import { useState } from "react";
import { Link } from "@remix-run/react";
import { SecondaryButton } from "../utils/BasicButton";
import { ArrowDropDown } from "../utils/icons";
import type {
  users,
  taskApplications,
  ApplicationStatus,
} from "@prisma/client";

interface TaskApplicantData {
  application: taskApplications;
  userData: users;
}

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
  onRemoveVolunteer,
  onUndoStatus,
}: TaskApplicantsProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
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

    switch (application.status) {
      case "ACCEPTED":
        return (
          <div className="flex gap-2">
            <SecondaryButton
              text="Undo Accept"
              action={() => onUndoStatus(application.id)}
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
          <div className="flex gap-2">
            <SecondaryButton
              text="Accept"
              action={() => onAccept(application.id)}
              ariaLabel="accept application"
            />
            <SecondaryButton
              text="Reject"
              action={() => onReject(application.id)}
              ariaLabel="reject application"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Transform the data to match component's needs
  const applicantsWithData = applicants.map(({ application, user }) => ({
    application,
    userData: user,
  }));

  return (
    <div
      className="bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 backdrop-blur-sm
                     border border-baseSecondary/10 transition-all duration-300 rounded-lg p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 ">
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h2
            id="applicants-heading"
            className="text-base font-semibold tracking-wide text-baseSecondary"
          >
            Task Applicants
          </h2>
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
              className="border border-baseSecondary  bg-gradient-to-br from-basePrimary/70 to-basePrimary/80 rounded-lg overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(application.id)}
                    className="flex items-center gap-2 text-baseSecondary hover:text-baseSecondary/80"
                  >
                    <span className="font-semibold">{userData.name}</span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${
                        expandedIds.includes(application.id) ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <span
                    className={`px-3 py-1 rounded-full text-basePrimaryLight ${getStatusColor(application.status)}`}
                  >
                    {application.status}
                  </span>
                </div>

                {expandedIds.includes(application.id) && (
                  <div className="mt-4 space-y-4">
                    {/* User Title/Role */}
                    <div>
                      <p className="text-baseSecondary">{userData.userTitle}</p>
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
                        <p className="text-baseSecondary text-sm">
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
                    <div className="flex gap-2 pt-2">
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
