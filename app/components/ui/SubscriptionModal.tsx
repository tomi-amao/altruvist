import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { motion } from "framer-motion";
import { Modal } from "../utils/Modal2";
import ReCaptcha from "../utils/ReCaptcha";

// Define type for the subscription response
type SubscriptionResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default function SubscriptionModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const fetcher = useFetcher<SubscriptionResponse>();

  // Determine the form status based on fetcher state
  const isSubmitting = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success;
  const errorMessage = fetcher.data?.error;

  // Reset the form and fetcher state when the modal closes
  const handleClose = () => {
    onClose();

    // We need to reset the form data here, not in the useEffect
    setEmail("");
    setGdprConsent(false);
    setRecaptchaToken("");
    setRecaptchaError(null);

    // Reset fetcher data by submitting an empty formData to a non-existent action
    // This is a workaround to clear fetcher.data
    if (fetcher.data) {
      setTimeout(() => {
        fetcher.submit({}, { action: "/api/reset-fetcher", method: "POST" });
      }, 100);
    }
  };

  // Handle form submission
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Subscription] Form submission started");

    if (!gdprConsent) {
      console.log("[Subscription] Submission blocked - GDPR consent not given");
      return;
    }

    if (!recaptchaToken) {
      console.log("[Subscription] No reCAPTCHA token available");
      setRecaptchaError("Please wait for security verification to complete");
      return;
    }

    console.log("[Subscription] Proceeding with submission");
    submitForm(recaptchaToken);
  };

  const submitForm = (token: string) => {
    console.log("[Subscription] Submitting form to API", {
      email,
      gdprConsent: gdprConsent.toString(),
      tokenLength: token.length,
    });

    const formData = new FormData();
    formData.append("email", email);
    formData.append("gdprConsent", gdprConsent.toString());
    formData.append("recaptchaToken", token);

    fetcher.submit(formData, { method: "POST", action: "/api/subscribe" });
  };

  // Handle reCAPTCHA token updates
  const handleRecaptchaToken = (token: string) => {
    console.log(
      "[Subscription] reCAPTCHA token received",
      token.substring(0, 10) + "...",
    );
    setRecaptchaToken(token);
    setRecaptchaError(null);
  };

  // Handle reCAPTCHA errors
  const handleRecaptchaError = (error: Error | string) => {
    const errorMessage =
      typeof error === "string" ? error : error.message || "reCAPTCHA error";
    console.error("[Subscription] reCAPTCHA error:", errorMessage);
    setRecaptchaError(errorMessage);
  };

  // Close modal after successful submission
  useEffect(() => {
    if (isSuccess) {
      console.log("[Subscription] Success, will close modal in 3 seconds");
      setTimeout(() => {
        handleClose(); // Use our custom close handler instead
      }, 3000);
    }
  }, [isSuccess]); // Remove onClose from dependencies

  // Watch for modal open/close state changes to reset fetcher on manual close
  useEffect(() => {
    if (!isOpen && fetcher.data) {
      // Reset fetcher when modal is closed manually
      setTimeout(() => {
        fetcher.submit({}, { action: "/api/reset-fetcher", method: "POST" });
      }, 100);
    }
  }, [isOpen, fetcher]);

  return (
    <div className="">
      <Modal isOpen={isOpen} onClose={handleClose}>
        {/* Only render ReCaptcha when modal is open */}
        {isOpen && (
          <ReCaptcha
            action="subscribe"
            onTokenChange={handleRecaptchaToken}
            onError={handleRecaptchaError}
          />
        )}

        <fetcher.Form
          onSubmit={handleSubscribe}
          className="space-y-4 bg-basePrimary p-4 rounded-lg"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-baseSecondary mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSubmitting || isSuccess}
              className="px-4 py-2 w-full placeholder:text-baseSecondary/50 bg-basePrimary/40 rounded-lg text-baseSecondary focus:outline-none focus:ring-2 focus:ring-accentPrimary border border-baseSecondary"
            />
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="gdpr"
                name="gdpr"
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                disabled={isSubmitting || isSuccess}
                required
                className="h-4 w-4 rounded border-baseSecondary text-accentPrimary focus:ring-accentPrimary"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="gdpr" className="font-medium text-baseSecondary">
                GDPR Consent
              </label>
              <p className="text-baseSecondary/70 text-xs">
                I consent to Altruvist storing and processing my personal data
                for the purpose of sending me updates about opportunities and
                services. I understand that I can unsubscribe at any time.
              </p>
            </div>
          </div>

          {/* Status messages */}
          {isSuccess && (
            <div className="text-green-500 text-sm p-2 bg-green-50 rounded-md">
              {fetcher.data?.message || "Successfully subscribed!"}
            </div>
          )}
          {(errorMessage || recaptchaError) && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
              {errorMessage || recaptchaError}
            </div>
          )}

          <div className="text-xs text-baseSecondary/70 mt-2">
            This site is protected by reCAPTCHA and the Google
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accentPrimary hover:underline"
            >
              {" "}
              Privacy Policy
            </a>{" "}
            and
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accentPrimary hover:underline"
            >
              {" "}
              Terms of Service
            </a>{" "}
            apply.
          </div>

          <div className="flex justify-end pt-2">
            <motion.button
              type="submit"
              disabled={
                isSubmitting || isSuccess || !gdprConsent || !recaptchaToken
              }
              className={`bg-accentPrimary text-baseSecondary px-4 py-2 rounded-lg hover:bg-accentPrimary/80 ${
                isSubmitting || isSuccess || !gdprConsent || !recaptchaToken
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              }`}
              whileHover={{
                scale:
                  !isSubmitting && !isSuccess && gdprConsent && recaptchaToken
                    ? 1.02
                    : 1,
              }}
              whileTap={{
                scale:
                  !isSubmitting && !isSuccess && gdprConsent && recaptchaToken
                    ? 0.98
                    : 1,
              }}
            >
              {isSubmitting
                ? "Subscribing..."
                : isSuccess
                  ? "Subscribed!"
                  : !recaptchaToken
                    ? "Verifying..."
                    : "Subscribe"}
            </motion.button>
          </div>
        </fetcher.Form>
      </Modal>
    </div>
  );
}
