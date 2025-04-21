import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { getEmailServiceVars } from "~/services/env.server";

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
  const RECAPTCHA_SECRET_KEY = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;

  // Log configuration state (without exposing sensitive keys)
  console.log("[API:Subscribe] Configuration check:", {
    hasBrevoKey: !!process.env.SMTP_API_KEY,
    hasRecaptchaKey: !!RECAPTCHA_SECRET_KEY,
  });

  // Check if API keys are configured
  if (!process.env.SMTP_API_KEY) {
    console.error("[API:Subscribe] Email service API key not configured");
    return json({ error: "Email service not configured" }, { status: 500 });
  }

  if (!RECAPTCHA_SECRET_KEY) {
    console.error("[API:Subscribe] reCAPTCHA secret key not configured");
    return json(
      { error: "reCAPTCHA verification not configured" },
      { status: 500 },
    );
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
      return json({ error: errorMessage }, { status: 400 });
    }

    // Verify reCAPTCHA token
    console.log("[API:Subscribe] Verifying reCAPTCHA token...");
    const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;

    const recaptchaResponse = await fetch(recaptchaVerifyUrl, {
      method: "POST",
    });

    const recaptchaData = await recaptchaResponse.json();

    console.log("[API:Subscribe] reCAPTCHA verification result:", {
      success: recaptchaData.success,
      score: recaptchaData.score,
      action: recaptchaData.action,
      hostname: recaptchaData.hostname,
      timestamp: new Date().toISOString(),
    });

    if (!recaptchaData.success) {
      console.error(
        "[API:Subscribe] reCAPTCHA verification failed:",
        recaptchaData["error-codes"],
      );
      return json(
        { error: "reCAPTCHA verification failed. Please try again." },
        { status: 400 },
      );
    }

    if (recaptchaData.score < 0.5) {
      console.warn("[API:Subscribe] Low reCAPTCHA score:", recaptchaData.score);
      return json(
        { error: "Security verification failed. Please try again later." },
        { status: 400 },
      );
    }

    if (recaptchaData.action !== "subscribe") {
      console.warn(
        "[API:Subscribe] Unexpected reCAPTCHA action:",
        recaptchaData.action,
      );
      // We'll continue but log this suspicious activity
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
          RECAPTCHA_SCORE: recaptchaData.score,
          SOURCE: "website_subscription_form",
        },
        listIds: [6], // Use your actual list ID from Brevo
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
        return json({ success: true, message: "You're already subscribed!" });
      }

      return json(
        { error: "Failed to subscribe. Please try again later." },
        { status: response.status },
      );
    }

    console.log("[API:Subscribe] Subscription successful!");
    return json({ success: true, message: "Successfully subscribed!" });
  } catch (error) {
    console.error("[API:Subscribe] Unexpected error:", error);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
