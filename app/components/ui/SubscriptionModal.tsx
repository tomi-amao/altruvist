import { useState, useEffect, useRef } from "react";
import { useFetcher } from "@remix-run/react";
import { motion } from "framer-motion";
import { Modal } from "../utils/Modal2";

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
  const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const fetcher = useFetcher<SubscriptionResponse>();
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // Determine the form status based on fetcher state
  const isSubmitting = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success;
  const errorMessage = fetcher.data?.error;

  // Load reCAPTCHA script when modal opens
  useEffect(() => {
    console.log(
      "[reCAPTCHA] Modal opened, checking if script needs to be loaded",
    );

    if (
      isOpen &&
      !window.grecaptcha &&
      !document.querySelector('script[src*="recaptcha"]')
    ) {
      console.log("[reCAPTCHA] Loading script...");
      const siteKey = window.ENV?.GOOGLE_RECAPTCHA_SITE_KEY;

      if (!siteKey) {
        console.error("[reCAPTCHA] Site key not found in window.ENV");
        setRecaptchaError("reCAPTCHA configuration error");
        return;
      }

      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("[reCAPTCHA] Script loaded successfully");
        setIsRecaptchaLoaded(true);
        setRecaptchaError(null);
      };
      script.onerror = (error) => {
        console.error("[reCAPTCHA] Script failed to load:", error);
        setRecaptchaError("Failed to load reCAPTCHA");
      };
      document.head.appendChild(script);
    } else if (isOpen && window.grecaptcha) {
      console.log("[reCAPTCHA] Script already loaded");
      setIsRecaptchaLoaded(true);
    }

    // Cleanup on modal close
    return () => {
      if (!isOpen) {
        console.log("[reCAPTCHA] Modal closed, resetting state");
        setEmail("");
        setGdprConsent(false);
        setRecaptchaToken("");
      }
    };
  }, [isOpen]);

  // Execute reCAPTCHA when loaded
  useEffect(() => {
    if (isRecaptchaLoaded && isOpen && window.grecaptcha) {
      console.log(
        "[reCAPTCHA] Script loaded and modal is open, executing reCAPTCHA",
      );

      try {
        window.grecaptcha.ready(() => {
          console.log(
            "[reCAPTCHA] Ready to execute with site key:",
            window.ENV.GOOGLE_RECAPTCHA_SITE_KEY,
          );

          window.grecaptcha
            .execute(window.ENV.GOOGLE_RECAPTCHA_SITE_KEY, {
              action: "subscribe",
            })
            .then((token: string) => {
              console.log(
                "[reCAPTCHA] Token generated successfully",
                token.substring(0, 10) + "...",
              );
              setRecaptchaToken(token);
              setRecaptchaError(null);
            })
            .catch((error: Error) => {
              console.error("[reCAPTCHA] Token generation failed:", error);
              setRecaptchaError("Failed to verify reCAPTCHA");
            });
        });
      } catch (error) {
        console.error("[reCAPTCHA] Execution error:", error);
        setRecaptchaError("reCAPTCHA error");
      }
    }
  }, [isRecaptchaLoaded, isOpen]);

  // Handle form submission
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Subscription] Form submission started");

    if (!gdprConsent) {
      console.log("[Subscription] Submission blocked - GDPR consent not given");
      return;
    }

    if (!recaptchaToken) {
      console.log("[reCAPTCHA] No token found, attempting to generate one");

      // Re-execute reCAPTCHA if token is missing
      if (window.grecaptcha) {
        try {
          window.grecaptcha
            .execute(window.ENV.GOOGLE_RECAPTCHA_SITE_KEY, {
              action: "subscribe",
            })
            .then((token: string) => {
              console.log(
                "[reCAPTCHA] Token generated on submit",
                token.substring(0, 10) + "...",
              );
              setRecaptchaToken(token);
              submitForm(token);
            })
            .catch((error: Error) => {
              console.error(
                "[reCAPTCHA] Token generation failed on submit:",
                error,
              );
              setRecaptchaError(
                "Failed to verify your request. Please try again.",
              );
            });
        } catch (error) {
          console.error("[reCAPTCHA] Execution error on submit:", error);
          setRecaptchaError("reCAPTCHA verification failed");
        }
      } else {
        console.error("[reCAPTCHA] grecaptcha not available on submit");
        setRecaptchaError(
          "reCAPTCHA not loaded. Please refresh and try again.",
        );
      }
      return;
    }

    console.log("[Subscription] Proceeding with existing token");
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

  // Close modal after successful submission
  useEffect(() => {
    if (isSuccess) {
      console.log("[Subscription] Success, will close modal in 3 seconds");
      setTimeout(() => {
        onClose();
        setEmail("");
        setGdprConsent(false);
      }, 3000);
    }
  }, [isSuccess, onClose]);

  return (
    <div className="">
      <Modal isOpen={isOpen} onClose={onClose}>
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

          {/* Hidden recaptcha badge */}
          <div ref={recaptchaRef} className="hidden"></div>

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
              disabled={isSubmitting || isSuccess || !gdprConsent}
              className={`bg-accentPrimary text-baseSecondary px-4 py-2 rounded-lg hover:bg-accentPrimary/80 ${
                isSubmitting || isSuccess || !gdprConsent
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              }`}
              whileHover={{
                scale: !isSubmitting && !isSuccess && gdprConsent ? 1.02 : 1,
              }}
              whileTap={{
                scale: !isSubmitting && !isSuccess && gdprConsent ? 0.98 : 1,
              }}
            >
              {isSubmitting
                ? "Subscribing..."
                : isSuccess
                  ? "Subscribed!"
                  : "Subscribe"}
            </motion.button>
          </div>
        </fetcher.Form>
      </Modal>
    </div>
  );
}
