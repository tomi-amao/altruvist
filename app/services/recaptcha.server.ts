/**
 * Server-side utility to verify reCAPTCHA tokens
 */

interface ReCaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  errorCodes?: string[];
  message?: string;
}

/**
 * Verifies a reCAPTCHA token with Google's API
 * @param token The reCAPTCHA token to verify
 * @param expectedAction Optional expected action to validate against
 * @param minimumScore Optional minimum score threshold (default 0.5)
 * @returns The verification result with success flag and details
 */
export async function verifyReCaptchaToken(
  token: string,
  expectedAction?: string,
  minimumScore: number = 0.5,
): Promise<ReCaptchaVerificationResult> {
  const RECAPTCHA_SECRET_KEY = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;

  if (!RECAPTCHA_SECRET_KEY) {
    console.error("[reCAPTCHA] Secret key not configured");
    return {
      success: false,
      message: "reCAPTCHA verification not configured",
    };
  }

  try {
    console.log("[reCAPTCHA] Verifying token...");

    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
      { method: "POST" },
    );

    const data = await response.json();

    console.log("[reCAPTCHA] Verification result:", {
      success: data.success,
      score: data.score,
      action: data.action,
      timestamp: new Date().toISOString(),
    });

    // Basic success check
    if (!data.success) {
      return {
        success: false,
        errorCodes: data["error-codes"],
        message: "reCAPTCHA verification failed",
      };
    }

    // Score check
    if (data.score < minimumScore) {
      console.warn("[reCAPTCHA] Low score:", data.score);
      return {
        success: false,
        score: data.score,
        message: "reCAPTCHA score too low",
      };
    }

    // Action check (if an expected action was provided)
    if (expectedAction && data.action !== expectedAction) {
      console.warn("[reCAPTCHA] Action mismatch:", {
        expected: expectedAction,
        received: data.action,
      });
      return {
        success: false,
        action: data.action,
        message: "reCAPTCHA action mismatch",
      };
    }

    return {
      success: true,
      score: data.score,
      action: data.action,
    };
  } catch (error) {
    console.error("[reCAPTCHA] Verification error:", error);
    return {
      success: false,
      message: "reCAPTCHA verification error",
    };
  }
}
