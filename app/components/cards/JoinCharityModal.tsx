import { useFetcher } from "@remix-run/react";
import { Modal } from "~/components/utils/Modal2";
import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "../utils/BasicButton";

interface JoinCharityModalProps {
  isOpen: boolean;
  onClose: () => void;
  charityId: string;
  charityName: string;
  userRole?: string[]; // Add userRole prop to determine options
}

export default function JoinCharityModal({
  isOpen,
  onClose,
  charityId,
  charityName,
  userRole = ["volunteer"], // Default to volunteer if not provided
}: JoinCharityModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["volunteer"]);
  const [applicationNote, setApplicationNote] = useState("");

  // Use the fetcher hook for data mutations
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  // Determine if user is a charity coordinator
  const isCharityUser = userRole.includes("charity");

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleKeyDown = (role: string, event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleRole(role);
    }
  };

  // Handle form submission through useFetcher
  const handleSubmit = () => {
    // For charity users applying as coordinator, treat it as an application
    if (isCharityUser) {
      fetcher.submit(
        {
          action: "apply",
          charityId,
          roles: JSON.stringify(["coordinator"]), // Only member role for charity users
          applicationNote,
        },
        {
          method: "post",
          action: "/api/charity-membership",
          encType: "application/x-www-form-urlencoded",
        },
      );
    } else {
      // Standard join for volunteers
      fetcher.submit(
        {
          action: "join",
          charityId,
          roles: JSON.stringify(selectedRoles),
          permissions: JSON.stringify([]), // Default permissions based on roles could be determined server-side
        },
        {
          method: "post",
          action: "/api/charity-membership",
          encType: "application/x-www-form-urlencoded",
        },
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-baseSecondary mb-4">
          {isCharityUser
            ? `Join ${charityName} as a Coordinator`
            : `Join ${charityName}`}
        </h2>

        <p className="text-baseSecondary/80 mb-6">
          {isCharityUser
            ? "Apply to join this charity as an coordinator. Your application will need approval."
            : "Select how you would like to contribute to this charity:"}
        </p>

        <div className="space-y-3 mb-6">
          {!isCharityUser ? (
            // Options for volunteer users
            <>
              <div
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedRoles.includes("volunteer")
                    ? "border-baseSecondary bg-basePrimary/40"
                    : "border-baseSecondary/30"
                }`}
                onClick={() => toggleRole("volunteer")}
                onKeyDown={(e) => handleKeyDown("volunteer", e)}
                tabIndex={0}
                role="checkbox"
                aria-checked={selectedRoles.includes("volunteer")}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                      selectedRoles.includes("volunteer")
                        ? "border-baseSecondary"
                        : "border-baseSecondary/30"
                    }`}
                  >
                    {selectedRoles.includes("volunteer") && (
                      <div className="w-3 h-3 rounded-full bg-baseSecondary"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-baseSecondary">
                      Volunteer
                    </h3>
                    <p className="text-sm text-baseSecondary/70">
                      Apply for and complete tasks for this charity
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedRoles.includes("supporter")
                    ? "border-baseSecondary bg-basePrimary/40"
                    : "border-baseSecondary/30"
                }`}
                onClick={() => toggleRole("supporter")}
                onKeyDown={(e) => handleKeyDown("supporter", e)}
                tabIndex={0}
                role="checkbox"
                aria-checked={selectedRoles.includes("supporter")}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                      selectedRoles.includes("supporter")
                        ? "border-baseSecondary"
                        : "border-baseSecondary/30"
                    }`}
                  >
                    {selectedRoles.includes("supporter") && (
                      <div className="w-3 h-3 rounded-full bg-baseSecondary"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-baseSecondary">
                      Supporter
                    </h3>
                    <p className="text-sm text-baseSecondary/70">
                      Follow this charity's activities and get updates
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Options for charity users (coordinator application)
            <>
              <div
                className={`p-4 border rounded-lg cursor-pointer border-baseSecondary bg-basePrimary/40`}
                role="radio"
                aria-checked={true}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-baseSecondary`}
                  >
                    <div className="w-3 h-3 rounded-full bg-baseSecondary"></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-baseSecondary">
                      Coordinator
                    </h3>
                    <p className="text-sm text-baseSecondary/70">
                      Manage charity tasks and approve volunteers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="applicationNote"
                  className="block text-baseSecondary font-medium mb-2"
                >
                  Reason for joining (optional)
                </label>
                <textarea
                  id="applicationNote"
                  className="w-full p-3 border border-baseSecondary/30 rounded-lg bg-basePrimary focus:outline-none focus:border-baseSecondary"
                  placeholder="Briefly explain why you'd like to join this charity as an coordinator..."
                  rows={3}
                  value={applicationNote}
                  onChange={(e) => setApplicationNote(e.target.value)}
                ></textarea>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <SecondaryButton
            text="Cancel"
            action={onClose}
            ariaLabel="Cancel joining charity"
            isDisabled={isSubmitting}
          />
          <PrimaryButton
            text={
              isSubmitting
                ? "Processing..."
                : isCharityUser
                  ? "Submit Application"
                  : "Join Charity"
            }
            action={handleSubmit}
            ariaLabel={
              isCharityUser
                ? "Submit coordinator application"
                : "Join this charity"
            }
            isDisabled={
              isSubmitting || (!isCharityUser && selectedRoles.length === 0)
            }
          />
        </div>
      </div>
    </Modal>
  );
}
