import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { verifyReCaptchaToken } from "~/services/recaptcha.server";

// Email validation schema with GDPR consent and reCAPTCHA token
const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  gdprConsent: z.string().refine((val) => val === "true", {
    message: "You must consent to our privacy policy",
  }),
  recaptchaToken: z.string().min(1, "reCAPTCHA verification failed"),
});

export async function action({ request }: ActionFunctionArgs) {
  console.log("[API:Subscribe] Received subscription request");

  // Get API keys from environment variables

  // Check if API key is configured
  if (!process.env.SMTP_API_KEY) {
    console.error("[API:Subscribe] Email service API key not configured");
    return data({ error: "Email service not configured" }, { status: 500 });
  }

  try {
    // Parse the form data
    const formData = await request.formData();
    const email = formData.get("email")?.toString() || "";
    const gdprConsent = formData.get("gdprConsent")?.toString() || "";
    const recaptchaToken = formData.get("recaptchaToken")?.toString() || "";

    console.log("[API:Subscribe] Form data received:", {
      email,
      gdprConsent,
      hasRecaptchaToken: !!recaptchaToken,
      tokenLength: recaptchaToken?.length,
    });

    // Validate the input
    const result = subscribeSchema.safeParse({
      email,
      gdprConsent,
      recaptchaToken,
    });

    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || "Invalid input";
      console.error("[API:Subscribe] Validation error:", result.error.issues);
      return { error: errorMessage };
    }

    // Verify reCAPTCHA token using our utility
    const recaptchaResult = await verifyReCaptchaToken(
      recaptchaToken,
      "subscribe",
    );

    if (!recaptchaResult.success) {
      console.error(
        "[API:Subscribe] reCAPTCHA verification failed:",
        recaptchaResult.message,
      );
      return  {
          error:
            recaptchaResult.message ||
            "Security verification failed. Please try again.",
        }
    }

    // Prepare request to Brevo API
    console.log(
      "[API:Subscribe] Preparing Brevo API request for email:",
      email,
    );
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.SMTP_API_KEY,
      },
      body: JSON.stringify({
        email,
        attributes: {
          GDPR_CONSENT: true,
          CONSENT_DATE: new Date().toISOString(),
          RECAPTCHA_SCORE: recaptchaResult.score,
          SOURCE: "website_subscription_form",
        },
        listIds: [6],
        updateEnabled: false,
        emailBlacklisted: false,
        smsBlacklisted: false,
      }),
    };

    // Make the API call to Brevo
    console.log("[API:Subscribe] Sending request to Brevo API");
    const response = await fetch("https://api.brevo.com/v3/contacts", options);
    const data = await response.json();

    console.log("[API:Subscribe] Brevo API response:", {
      status: response.status,
      ok: response.ok,
      responseData: data,
    });

    if (!response.ok) {
      console.error("[API:Subscribe] Brevo API error:", data);

      // Handle already existing subscriber case
      if (data.code === "duplicate_parameter") {
        console.log("[API:Subscribe] Email already exists in the list");
        return { success: true, message: "You're already subscribed!" };
      }

      return { error: "Failed to subscribe. Please try again later." };
    }

    console.log("[API:Subscribe] Subscription successful!");
    return { success: true, message: "Successfully subscribed!" };
  } catch (error) {
    console.error("[API:Subscribe] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}
