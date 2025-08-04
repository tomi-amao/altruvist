import { useState, useEffect, useCallback } from "react";

type RecaptchaProps = {
  action: string;
  onTokenChange: (token: string) => void;
  onError?: (error: Error | string) => void;
  onStatusChange?: (
    status: "loading" | "ready" | "error" | "executing" | "complete",
  ) => void;
};

export default function ReCaptcha({
  action,
  onTokenChange,
  onError,
  onStatusChange,
}: RecaptchaProps) {
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "executing" | "complete"
  >("loading");

  // Update external status tracker if provided
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  // Function to load reCAPTCHA script
  const loadReCaptchaScript = useCallback(() => {
    if (window.grecaptcha) {
      console.log("[reCAPTCHA] Script already loaded");
      setStatus("ready");
      return;
    }

    if (document.querySelector('script[src*="recaptcha"]')) {
      console.log("[reCAPTCHA] Script is loading...");
      return;
    }

    console.log("[reCAPTCHA] Loading script...");
    const siteKey = window.ENV?.GOOGLE_RECAPTCHA_SITE_KEY;

    if (!siteKey) {
      console.error("[reCAPTCHA] Site key not found in window.ENV");
      setStatus("error");
      if (onError) onError("reCAPTCHA site key not configured");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("[reCAPTCHA] Script loaded successfully");
      setStatus("ready");
    };

    script.onerror = (error) => {
      console.error("[reCAPTCHA] Script failed to load:", error);
      setStatus("error");
      if (onError) onError("Failed to load reCAPTCHA");
    };

    document.head.appendChild(script);
  }, [onError]);

  // Function to execute reCAPTCHA and get a token
  const executeReCaptcha = useCallback(() => {
    if (status !== "ready" || !window.grecaptcha) {
      return;
    }

    setStatus("executing");
    console.log("[reCAPTCHA] Executing for action:", action);

    try {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(window.ENV.GOOGLE_RECAPTCHA_SITE_KEY, { action })
          .then((token: string) => {
            console.log(
              "[reCAPTCHA] Token generated successfully",
              token.substring(0, 10) + "...",
            );
            onTokenChange(token);
            setStatus("complete");
          })
          .catch((error: Error) => {
            console.error("[reCAPTCHA] Token generation failed:", error);
            setStatus("error");
            if (onError) onError(error);
          });
      });
    } catch (error) {
      console.error("[reCAPTCHA] Execution error:", error);
      setStatus("error");
      if (onError) onError("reCAPTCHA execution error");
    }
  }, [status, action, onTokenChange, onError]);

  // Load reCAPTCHA script on mount
  useEffect(() => {
    loadReCaptchaScript();
  }, []);

  // Execute reCAPTCHA when script is ready
  useEffect(() => {
    if (status === "ready") {
      executeReCaptcha();
    }
  }, [status, executeReCaptcha]);

  // Re-execute when action changes
  useEffect(() => {
    if (status === "ready" || status === "complete") {
      executeReCaptcha();
    }
  }, [action, executeReCaptcha, status]);

  // This component doesn't render anything visible
  return null;
}
