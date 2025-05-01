import {
  CheckCircle,
  XCircle,
  UserPlus,
  Clock,
  Info,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { PrimaryButton, SecondaryButton } from "~/components/utils/BasicButton";
import { Modal } from "~/components/utils/Modal2";
import { useState } from "react";
import type { CharityApplication } from "~/types/charities";

type ApplicationsListProps = {
  applications: CharityApplication[];
  onReviewApplication: (
    application: CharityApplication & {
      decision: "ACCEPTED" | "REJECTED";
      reviewNote: string;
    },
  ) => void;
  isSubmitting: boolean;
};

export function ApplicationsList({
  applications,
  onReviewApplication,
  isSubmitting,
}: ApplicationsListProps) {
  const [selectedApplication, setSelectedApplication] =
    useState<CharityApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<
    "ACCEPTED" | "REJECTED" | null
  >(null);
  const [reviewNote, setReviewNote] = useState("");

  const handleOpenReviewModal = (application: CharityApplication) => {
    setSelectedApplication(application);
    setReviewDecision(null);
    setReviewNote("");
    setShowApplicationModal(true);
  };

  const handleSubmitReview = () => {
    if (!selectedApplication || !reviewDecision) return;

    onReviewApplication({
      ...selectedApplication,
      decision: reviewDecision,
      reviewNote: reviewNote,
    });

    setShowApplicationModal(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-baseSecondary">
          Pending Applications
        </h2>
        <div className="bg-baseSecondary/10 px-3 py-2 rounded-lg flex items-center">
          <Info size={18} className="text-baseSecondary mr-2" />
          <span className="text-baseSecondary text-sm">
            {applications.length === 0
              ? "No pending applications"
              : `${applications.length} pending application${applications.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-confirmPrimary mb-3" />
          <h3 className="text-xl font-semibold text-baseSecondary mb-2">
            All caught up!
          </h3>
          <p className="text-baseSecondary/70 max-w-md mx-auto">
            There are no pending applications to review for this charity.
          </p>
        </div>
      ) : (
        <div className="">
          {applications.map((application) => (
            <div
              key={application.id}
              className="border border-baseSecondary/80 p-4 bg-basePrimary  rounded-lg space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus size={20} className="text-baseSecondary" />
                    <h3 className="text-lg font-medium text-baseSecondary">
                      {application.user.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accentPrimary/20 text-indicator-orange">
                      <Clock size={12} className="mr-1" />
                      Pending
                    </span>
                  </div>

                  <p className="text-baseSecondary/70 mb-2">
                    <span className="font-medium">Email:</span>
                    {application.user.email}
                  </p>

                  <p className="text-baseSecondary/70 mb-2">
                    <span className="font-medium">Roles:</span>
                    {application.roles.map((role: string) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-baseSecondary/10 text-baseSecondary capitalize ml-1"
                      >
                        {role}
                      </span>
                    ))}
                  </p>

                  <p className="text-baseSecondary/70">
                    <span className="font-medium">Applied:</span>
                    {format(
                      new Date(application.appliedAt),
                      "MMMM d, yyyy 'at' h:mm a",
                    )}
                  </p>

                  {application.applicationNote && (
                    <div className="mt-3 p-3 bg-basePrimary/50 rounded-lg border border-baseSecondary/10">
                      <p className="text-sm text-baseSecondary/90 italic">
                        "{application.applicationNote}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <PrimaryButton
                    text="Review Application"
                    ariaLabel="Review application"
                    action={() => handleOpenReviewModal(application)}
                    isDisabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Review Modal */}
      <Modal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
      >
        {selectedApplication && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-baseSecondary mb-4">
              Review Application
            </h2>

            <div className="bg-basePrimary/40 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-baseSecondary/70 mb-1">
                    Applicant
                  </p>
                  <p className="text-baseSecondary font-medium">
                    {selectedApplication.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-baseSecondary/70 mb-1">Email</p>
                  <p className="text-baseSecondary">
                    {selectedApplication.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-baseSecondary/70 mb-1">Charity</p>
                  <p className="text-baseSecondary">
                    {selectedApplication.charity.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-baseSecondary/70 mb-1">
                    Applied For
                  </p>
                  <div className="flex gap-1">
                    {selectedApplication.roles.map((role: string) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-baseSecondary/10 text-baseSecondary capitalize"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <p className="text-sm text-baseSecondary/70 mb-1">
                    Applied On
                  </p>
                  <p className="text-baseSecondary">
                    {format(
                      new Date(selectedApplication.appliedAt),
                      "MMMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
              </div>

              {selectedApplication.applicationNote && (
                <div className="mt-4 pt-4 border-t border-baseSecondary/10">
                  <p className="text-sm text-baseSecondary/70 mb-2">
                    Application Note
                  </p>
                  <p className="text-baseSecondary italic">
                    "{selectedApplication.applicationNote}"
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label
                htmlFor="decision-buttons"
                className="block text-baseSecondary font-medium mb-2"
              >
                Decision
              </label>
              <div id="decision-buttons" className="flex gap-3">
                <button
                  className={`flex-1 px-4 py-3 rounded-lg border ${
                    reviewDecision === "ACCEPTED"
                      ? "bg-confirmPrimary/10 border-confirmPrimary text-confirmPrimary"
                      : "border-baseSecondary/20 text-baseSecondary hover:bg-confirmPrimary/5"
                  }`}
                  onClick={() => setReviewDecision("ACCEPTED")}
                >
                  <div className="flex justify-center items-center">
                    <CheckCircle size={20} className="mr-2" />
                    Approve
                  </div>
                </button>
                <button
                  className={`flex-1 px-4 py-3 rounded-lg border ${
                    reviewDecision === "REJECTED"
                      ? "bg-dangerPrimary/10 border-dangerPrimary text-dangerPrimary"
                      : "border-baseSecondary/20 text-baseSecondary hover:bg-dangerPrimary/5"
                  }`}
                  onClick={() => setReviewDecision("REJECTED")}
                >
                  <div className="flex justify-center items-center">
                    <XCircle size={20} className="mr-2" />
                    Reject
                  </div>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="reviewNote"
                className="block text-baseSecondary font-medium mb-2"
              >
                Note (Optional)
              </label>
              <textarea
                id="reviewNote"
                className="w-full p-3 border border-baseSecondary/30 rounded-lg bg-basePrimary focus:outline-none focus:border-baseSecondary"
                placeholder="Add a note explaining your decision..."
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <SecondaryButton
                text="Cancel"
                action={() => setShowApplicationModal(false)}
                ariaLabel="Cancel review"
                disabled={isSubmitting}
              />
              <PrimaryButton
                text={isSubmitting ? "Submitting..." : "Submit Decision"}
                action={handleSubmitReview}
                ariaLabel="Submit application review"
                disabled={isSubmitting || !reviewDecision}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
