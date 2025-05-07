import { ActionFunctionArgs, data, MetaFunction } from "react-router";
import { useActionData, Form, useNavigation } from "react-router";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import LandingHeader from "~/components/navigation/LandingHeader";
import Footer from "~/components/navigation/Footer";
import ReCaptcha from "~/components/utils/ReCaptcha";
import { verifyReCaptchaToken } from "~/services/recaptcha.server";
import nodemailer from "nodemailer";
import { getSession, commitSession } from "~/services/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Contact Us | Altruvist" },
    {
      name: "description",
      content:
        "Get in touch with the Altruvist team to learn more about our volunteering platform.",
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

// Define the return type for the action function
type ActionData =
  | { errors: Record<string, string>; success: false; message?: string }
  | { success: true; message: string; errors?: never };

// Add constants for rate limiting
const THROTTLE_TIME = 60000; // 1 minute in milliseconds
const MAX_EMAILS_PER_SESSION = 5; // Maximum emails per session

export async function action({ request }: ActionFunctionArgs) {
  // Get the session to implement throttling
  const session = await getSession(request);
  const now = Date.now();

  // Check if user has sent too many emails
  const emailCount = session.get("emailCount") || 0;
  if (emailCount >= MAX_EMAILS_PER_SESSION) {
    return {
      success: false,
      message:
        "You've reached the maximum number of messages allowed. Please try again later.",
      errors: { form: "Maximum email limit reached" },
    };
  }

  // Check if user is sending emails too frequently
  const lastEmailTime = session.get("lastEmailTime") || 0;
  const timeSinceLastEmail = now - lastEmailTime;

  if (lastEmailTime && timeSinceLastEmail < THROTTLE_TIME) {
    const waitTime = Math.ceil((THROTTLE_TIME - timeSinceLastEmail) / 1000);
    return {
      success: false,
      message: `Please wait ${waitTime} seconds before sending another message.`,
      errors: { form: "Rate limit exceeded" },
    };
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const subject = formData.get("subject");
  const message = formData.get("message");
  const recaptchaToken = formData.get("recaptchaToken");

  // Form validation
  const errors: Record<string, string> = {};
  if (!name || typeof name !== "string" || name.trim() === "") {
    errors.name = "Name is required";
  }

  if (!email || typeof email !== "string" || email.trim() === "") {
    errors.email = "Email is required";
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = "Invalid email format";
  }

  if (!subject || typeof subject !== "string" || subject.trim() === "") {
    errors.subject = "Subject is required";
  }

  if (!message || typeof message !== "string" || message.trim() === "") {
    errors.message = "Message is required";
  }

  if (!recaptchaToken || typeof recaptchaToken !== "string") {
    errors.recaptcha = "reCAPTCHA verification failed";
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false,
      message: "Please correct the errors in the form.",
    };
  }

  // Verify the reCAPTCHA token
  if (recaptchaToken) {
    const recaptchaResult = await verifyReCaptchaToken(
      recaptchaToken as string,
      "contact_form",
    );

    if (!recaptchaResult.success) {
      return {
        success: false,
        message: "Security verification failed. Please try again.",
        errors: {
          recaptcha: recaptchaResult.message || "reCAPTCHA verification failed",
        },
      };
    }
  }

  try {
    // Configure nodemailer transport with Brevo SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.SMTP_SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_SMTP_USER,
        pass: process.env.SMTP_SMTP_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.CONTACT_EMAIL_FROM || "contact@altruvist.org",
      to: process.env.CONTACT_EMAIL_TO || "theignorant.views@gmail.com",
      replyTo: email as string,
      subject: `Contact Form: ${subject}`,
      text: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        
        Message:
        ${message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <h3>Message:</h3>
        <p>${(message as string).replace(/\n/g, "<br>")}</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Update session with throttling information
    session.set("lastEmailTime", now);
    session.set("emailCount", emailCount + 1);

    return data<ActionData>(
      {
        success: true,
        message: "Thanks for reaching out! We'll get back to you shortly.",
      },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return{
      success: false,
      message:
        "There was an error sending your message. Please try again later.",
      errors: { form: "Failed to send email. Please try again later." },
    };
  }
}

export default function ContactRoute() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting =
    navigation.formAction === "/contact" && navigation.state === "submitting";
  const [formSubmitted, setFormSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  // Use useEffect to handle successful form submission
  useEffect(() => {
    if (actionData?.success && navigation.state === "idle") {
      setFormSubmitted(true);
    }
  }, [actionData, navigation.state]);

  // Function to reset the form
  const resetForm = () => {
    setFormSubmitted(false);
    setRecaptchaToken("");
    // Reset the action data by posting a dummy request that will be immediately canceled
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const handleRecaptchaError = (error: Error | string) => {
    setRecaptchaError(
      typeof error === "string" ? error : error.message || "reCAPTCHA error",
    );
  };

  return (
    <div className="min-h-screen bg-basePrimaryLight">
      <LandingHeader />

      {/* Hidden reCAPTCHA component */}
      <ReCaptcha
        action="contact_form"
        onTokenChange={setRecaptchaToken}
        onError={handleRecaptchaError}
      />

      <section className="py-20 md:py-28 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Page Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-baseSecondary/90">
              Get in <span className="text-baseSecondary text-5xl font-light">Touch</span>
            </h1>
            <p className="text-lg text-midGrey max-w-xl mx-auto">
              Have questions, feedback, or want to learn more about Altruvist?
              We're here to help! Fill out the form below, and we'll get back
              to you as soon as possible.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-basePrimary rounded-xl p-8 shadow-lg h-full">
                <h2 className="text-2xl font-semibold text-baseSecondary mb-6">
                  Contact Information
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-accentPrimary font-medium mb-2">
                      Our Location
                    </h3>
                    <p className="text-midGrey">
                      123 Volunteer Street
                      <br />
                      London, UK
                      <br />
                      SW1A 1AA
                    </p>
                  </div>

                  <div>
                    <h3 className="text-accentPrimary font-medium mb-2">
                      Email Us
                    </h3>
                    <a
                      href="mailto:hello@altruvist.org"
                      className="text-midGrey hover:text-accentPrimary transition-colors"
                    >
                      theignorant.views@gmail.com
                    </a>
                  </div>

                  <div>
                    <h3 className="text-accentPrimary font-medium mb-2">
                      Call Us
                    </h3>
                    <a
                      href="tel:+442071234567"
                      className="text-midGrey hover:text-accentPrimary transition-colors"
                    >
                      +44 00 0000 0000
                    </a>
                  </div>

                  <div>
                    <h3 className="text-accentPrimary font-medium mb-4">
                      Follow Us
                    </h3>
                    <div className="flex space-x-4">
                      <a
                        href="https://twitter.com/altruvist"
                        className="text-midGrey hover:text-accentPrimary transition-colors"
                        aria-label="Twitter"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                        </svg>
                      </a>
                      <a
                        href="https://linkedin.com/company/altruvist"
                        className="text-midGrey hover:text-accentPrimary transition-colors"
                        aria-label="LinkedIn"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>
                      <a
                        href="https://instagram.com/altruvist_org"
                        className="text-midGrey hover:text-accentPrimary transition-colors"
                        aria-label="Instagram"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-basePrimary rounded-xl p-8 shadow-lg">
                {formSubmitted ? (
                  <motion.div
                    className="text-center py-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-16 h-16 bg-confirmPrimary/20 text-confirmPrimary rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-baseSecondary mb-3">
                      Message Sent!
                    </h2>
                    <p className="text-midGrey max-w-md mx-auto mb-6">
                      {actionData?.message ||
                        "Thanks for reaching out! We'll get back to you shortly."}
                    </p>
                    <button
                      onClick={resetForm}
                      className="inline-flex items-center px-4 py-2 border border-accentPrimary text-accentPrimary bg-transparent rounded-lg hover:bg-accentPrimary/5 transition-all duration-300"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-2xl font-semibold text-baseSecondary mb-6">
                      Send Us a Message
                    </h2>

                    <Form ref={formRef} method="post" noValidate>
                      {/* Rate limiting error message */}
                      {actionData?.success === false &&
                        actionData.errors.form && (
                          <div className="mb-6 p-4 bg-dangerPrimary/10 border border-dangerPrimary/30 rounded-lg">
                            <p className="text-dangerPrimary text-sm flex items-center">
                              <svg
                                className="w-5 h-5 mr-2 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>{actionData.message}</span>
                            </p>
                          </div>
                        )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-midGrey mb-2 font-primary"
                          >
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            className={`w-full px-4 py-3 bg-basePrimaryLight rounded-lg   focus:outline-none focus:ring-2 transition-all ${
                              actionData?.success === false &&
                              actionData.errors.name
                                ? "border-dangerPrimary focus:ring-dangerPrimary/30"
                                : "border-lightGrey focus:ring-accentPrimary/30"
                            }`}
                            placeholder="Your name"
                          />
                          {actionData?.success === false &&
                            actionData.errors.name && (
                              <p className="text-dangerPrimary text-sm mt-1">
                                {actionData.errors.name}
                              </p>
                            )}
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-midGrey mb-2 font-primary"
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            className={`w-full px-4 py-3 bg-basePrimaryLight rounded-lg  focus:outline-none focus:ring-2 transition-all ${
                              actionData?.success === false &&
                              actionData.errors.email
                                ? "border-dangerPrimary focus:ring-dangerPrimary/30"
                                : "border-lightGrey focus:ring-accentPrimary/30"
                            }`}
                            placeholder="Your email address"
                          />
                          {actionData?.success === false &&
                            actionData.errors.email && (
                              <p className="text-dangerPrimary text-sm mt-1">
                                {actionData.errors.email}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className="mb-6">
                        <label
                          htmlFor="subject"
                          className="block text-midGrey mb-2 font-primary"
                        >
                          Subject
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          className={`w-full px-4 py-3 bg-basePrimaryLight rounded-lg  focus:outline-none focus:ring-2 transition-all ${
                            actionData?.success === false &&
                            actionData.errors.subject
                              ? "border-dangerPrimary focus:ring-dangerPrimary/30"
                              : "border-lightGrey focus:ring-accentPrimary/30"
                          }`}
                          placeholder="What's this about?"
                        />
                        {actionData?.success === false &&
                          actionData.errors.subject && (
                            <p className="text-dangerPrimary text-sm mt-1">
                              {actionData.errors.subject}
                            </p>
                          )}
                      </div>

                      <div className="mb-6">
                        <label
                          htmlFor="message"
                          className="block text-midGrey mb-2 font-primary"
                        >
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={6}
                          className={`w-full px-4 py-3 bg-basePrimaryLight rounded-lg  focus:outline-none focus:ring-2 resize-none transition-all ${
                            actionData?.success === false &&
                            actionData.errors.message
                              ? "border-dangerPrimary focus:ring-dangerPrimary/30"
                              : "border-lightGrey focus:ring-accentPrimary/30"
                          }`}
                          placeholder="How can we help you?"
                        ></textarea>
                        {actionData?.success === false &&
                          actionData.errors.message && (
                            <p className="text-dangerPrimary text-sm mt-1">
                              {actionData.errors.message}
                            </p>
                          )}
                      </div>

                      {/* reCAPTCHA error message */}
                      {((actionData?.success === false &&
                        actionData.errors.recaptcha) ||
                        recaptchaError) && (
                        <div className="mb-6 p-4 bg-dangerPrimary/10 border border-dangerPrimary/30 rounded-lg">
                          <p className="text-dangerPrimary text-sm flex items-center">
                            <svg
                              className="w-5 h-5 mr-2 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {actionData?.errors.recaptcha ||
                                recaptchaError ||
                                "Security verification failed"}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Hidden input for reCAPTCHA token */}
                      <input
                        type="hidden"
                        name="recaptchaToken"
                        value={recaptchaToken}
                      />

                      <div className="text-xs text-baseSecondary/70 mt-2 mb-6">
                        This site is protected by reCAPTCHA and the Google
                        <a
                          href="https://policies.google.com/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accentPrimary hover:underline"
                        >
                          Privacy Policy
                        </a>
                        and
                        <a
                          href="https://policies.google.com/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accentPrimary hover:underline"
                        >
                          Terms of Service
                        </a>
                        apply.
                      </div>

                      <motion.button
                        type="submit"
                        className={`w-full py-3 px-4 bg-accentPrimary text-baseSecondary rounded-lg font-medium shadow-lg flex items-center justify-center transition-all ${
                          isSubmitting || !recaptchaToken
                            ? "opacity-70 cursor-not-allowed"
                            : "hover:bg-accentPrimaryDark"
                        }`}
                        whileHover={{
                          scale: isSubmitting || !recaptchaToken ? 1 : 1.02,
                        }}
                        whileTap={{
                          scale: isSubmitting || !recaptchaToken ? 1 : 0.98,
                        }}
                        disabled={isSubmitting || !recaptchaToken}
                      >
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-baseSecondary"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Sending...
                          </>
                        ) : !recaptchaToken ? (
                          "Verifying..."
                        ) : (
                          "Send Message"
                        )}
                      </motion.button>
                    </Form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-basePrimary">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-baseSecondary">
              Frequently Asked Questions
            </h2>
            <p className="text-midGrey max-w-xl mx-auto">
              Find answers to common questions about the Altruvist platform.
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                question: "How do I sign up as a volunteer?",
                answer:
                  "You can sign up by clicking the 'Get Started' button on our homepage, then filling out the registration form. Once registered, you can complete your profile with your skills and interests to find matching opportunities.",
              },
              {
                question:
                  "I'm an organization. How can I post volunteering opportunities?",
                answer:
                  "Organizations need to create an account and complete a verification process. Once verified, you'll be able to post opportunities and manage volunteer applications through your dashboard.",
              },
              {
                question:
                  "Are there any costs associated with using Altruvist?",
                answer:
                  "Altruvist is completely free for volunteers. Organizations have free access to basic features, with premium options available for additional capabilities and support.",
              },
              {
                question: "How does the matching process work?",
                answer:
                  "Our platform uses skill tags and interests to match volunteers with relevant opportunities. Volunteers can also browse and filter opportunities based on categories, required skills, and time commitment.",
              },
              {
                question: "Can I volunteer remotely?",
                answer:
                  "Yes! Many opportunities on Altruvist can be completed remotely. You can filter for remote-only positions when browsing opportunities.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="bg-basePrimaryLight rounded-xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-baseSecondary mb-2">
                  {faq.question}
                </h3>
                <p className="text-midGrey">{faq.answer}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <p className="text-midGrey mb-4">
              Still have questions? We're here to help!
            </p>
            <a
              href="mailto:support@altruvist.org"
              className="inline-flex items-center text-baseSecondary hover:text-accentPrimaryDark transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              support@altruvist.org
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
