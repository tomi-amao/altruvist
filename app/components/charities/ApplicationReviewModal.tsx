import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { format } from "date-fns";
import { PrimaryButton, SecondaryButton } from "~/components/utils/BasicButton";
import { Modal } from "~/components/utils/Modal2";
import type { CharityApplication } from "~/types/charities";

type ApplicationReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedApplication: CharityApplication;
  onSubmitReview: (decision: "ACCEPTED" | "REJECTED", note: string) => void;
  isSubmitting: boolean;
};

export function ApplicationReviewModal({
  isOpen,
  onClose,
  selectedApplication,
  onSubmitReview,
  isSubmitting,
}: ApplicationReviewModalProps) {
  const [reviewDecision, setReviewDecision] = useState<
    "ACCEPTED" | "REJECTED" | null
  >(null);
  const [reviewNote, setReviewNote] = useState("");

  const handleSubmit = () => {
    if (!reviewDecision) return;
    onSubmitReview(reviewDecision, reviewNote);
  };

  // Reset state when modal opens/closes
  const handleClose = () => {
    setReviewDecision(null);
    setReviewNote("");
    onClose();
  };

  if (!selectedApplication) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-baseSecondary mb-4">
          Review Application
        </h2>

        <div className="bg-basePrimary/40 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-baseSecondary/70 mb-1">Applicant</p>
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
              <p className="text-sm text-baseSecondary/70 mb-1">Applied For</p>
              <div className="flex flex-wrap gap-1">
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
              <p className="text-sm text-baseSecondary/70 mb-1">Applied On</p>
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
            htmlFor="reviewDecision"
            className="block text-baseSecondary font-medium mb-2"
          >
            Decision
          </label>
          <div className="flex gap-3" id="reviewDecision">
            <button
              type="button"
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
              type="button"
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
            className="w-full p-3 border border-baseSecondary/30 rounded-lg bg-basePrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary/50 focus:border-transparent"
            placeholder="Add a note explaining your decision..."
            rows={3}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <SecondaryButton
            text="Cancel"
            action={handleClose}
            ariaLabel="Cancel review"
            isDisabled={isSubmitting}
          />
          <PrimaryButton
            text={isSubmitting ? "Submitting..." : "Submit Decision"}
            action={handleSubmit}
            ariaLabel="Submit application review"
            isDisabled={isSubmitting || !reviewDecision}
          />
        </div>
      </div>
    </Modal>
  );
}
