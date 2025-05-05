import { json, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { motion } from "framer-motion";
import { useState } from "react";
import LandingHeader from "~/components/navigation/LandingHeader";
import Footer from "~/components/navigation/Footer";

export const meta: MetaFunction = () => {
  return [
    { title: "Frequently Asked Questions | Altruvist" },
    {
      name: "description",
      content:
        "Find answers to common questions about volunteering, charity resources, and using the Altruvist platform.",
    },
  ];
};

export const loader = async () => {
  // Organized FAQ sections
  return json({
    categories: [
      {
        title: "For Volunteers",
        questions: [
          {
            question: "How much time do I need to commit?",
            answer:
              "Time commitments vary by opportunity. Some tasks might require just a few hours, while others might be ongoing projects spanning several weeks. You can filter opportunities based on your availability and only commit to what fits your schedule.",
          },
          {
            question: "Do I need special skills to volunteer?",
            answer:
              "Altruvist specializes in skills-based volunteering, so having specific skills (especially digital or professional skills) is helpful. However, we have opportunities for various skill levels, from beginners to experts.",
          },
          {
            question: "Can I volunteer remotely?",
            answer:
              "Yes! Many opportunities on Altruvist are remote/virtual, allowing you to contribute from anywhere in the world. You can filter opportunities by location type to find remote-friendly tasks.",
          },
          {
            question: "Will I receive training?",
            answer:
              "This depends on the specific opportunity. Some organizations provide training, while others require volunteers to already possess certain skills. Each listing specifies any training provided.",
          },
          {
            question: "How do I track my impact?",
            answer:
              "Your Altruvist dashboard automatically tracks your completed tasks, hours contributed, and the causes you've supported. This creates a comprehensive record of your volunteering journey.",
          },
          {
            question: "Can I volunteer as a team or with my company?",
            answer:
              "Yes! Many organizations welcome team volunteering. Contact us directly for corporate volunteering opportunities or to coordinate team-based projects.",
          },
          {
            question: "How do I sign up as a volunteer?",
            answer:
              "You can sign up by clicking the 'Get Started' button on our homepage, then filling out the registration form. Once registered, you can complete your profile with your skills and interests to find matching opportunities.",
          },
        ],
      },
      {
        title: "For Charities & Nonprofits",
        questions: [
          {
            question: "How do I verify my nonprofit status on Altruvist?",
            answer:
              "During registration, select 'Charity' as your organization type and provide your nonprofit registration number. Our team will verify your status within 1-2 business days. For expedited verification, you can email supporting documentation to verification@Altruvist.org.",
          },
          {
            question:
              "Can we have multiple accounts for different departments?",
            answer:
              "Yes! Altruvist allows multiple users to be associated with your organization. The primary account holder can invite team members who will have access to manage projects, communicate with volunteers, and track progress.",
          },
          {
            question: "Is there a limit to how many tasks we can post?",
            answer:
              "Standard charity accounts can post up to 10 active tasks at a time. If you need to post more, please contact us to discuss options for your organization's specific needs.",
          },
          {
            question:
              "How can we feature our organization to attract more volunteers?",
            answer:
              "Complete your organization profile with a compelling mission statement, impact stories, and high-quality images. We recommend also keeping your task listings current and providing feedback to volunteers, as these factors improve your visibility in search results.",
          },
          {
            question:
              "Can we find volunteers for ongoing roles, not just projects?",
            answer:
              "Absolutely! When creating a task, you can specify that you're looking for ongoing commitment. Use the 'Recurring' option and specify the time commitment needed. Many professionals are interested in long-term volunteer relationships.",
          },
          {
            question: "How can I post volunteering opportunities?",
            answer:
              "Organizations need to create an account and complete a verification process. Once verified, you'll be able to post opportunities and manage volunteer applications through your dashboard.",
          },
        ],
      },
      {
        title: "About the Platform",
        questions: [
          {
            question: "Are there any costs associated with using Altruvist?",
            answer:
              "Altruvist is completely free for volunteers. Organizations have free access to basic features, with premium options available for additional capabilities and support.",
          },
          {
            question: "How does the matching process work?",
            answer:
              "Our platform uses skill tags and interests to match volunteers with relevant opportunities. Volunteers can also browse and filter opportunities based on categories, required skills, and time commitment.",
          },
          {
            question: "Is my personal information secure?",
            answer:
              "Yes. We take data protection seriously and comply with relevant privacy regulations. We only collect information necessary to operate the platform and never share your personal details with third parties without your explicit consent.",
          },
          {
            question: "Can I use Altruvist on mobile devices?",
            answer:
              "Yes, Altruvist is fully responsive and works on smartphones and tablets. We're also developing dedicated mobile apps to enhance the experience further.",
          },
          {
            question:
              "What happens if I can't complete a task I've committed to?",
            answer:
              "We understand that circumstances change. If you can't complete a task, please communicate with the organization as soon as possible. You can withdraw from a task through your dashboard, though we encourage providing notice to allow organizations to find a replacement.",
          },
          {
            question: "How do I report inappropriate content or users?",
            answer:
              "You can report concerns by clicking the 'Report' button on any task or user profile, or by contacting our support team at support@Altruvist.org. We take all reports seriously and will investigate promptly.",
          },
        ],
      },
      {
        title: "Technical Questions",
        questions: [
          {
            question: "I'm having trouble with my account. What should I do?",
            answer:
              "First, try clearing your browser cache and cookies, then restart your browser. If problems persist, please contact our support team at support@Altruvist.org with details about the issue, including any error messages and the device/browser you're using.",
          },
          {
            question:
              "Can I integrate Altruvist with other tools my organization uses?",
            answer:
              "Yes, we offer API integrations with popular project management, CRM, and communication tools. Premium accounts have access to more integration options. Contact our team for details about specific integrations.",
          },
          {
            question: "How do I reset my password?",
            answer:
              "Click 'Forgot Password' on the login page and follow the instructions sent to your registered email address. If you don't receive the email, check your spam folder or contact support for assistance.",
          },
          {
            question: "Is there a limit to the size of files I can upload?",
            answer:
              "Yes, the current file size limit is 25MB per upload. If you need to share larger files, we recommend using a file-sharing service like Google Drive or Dropbox and sharing the link in your task description or messages.",
          },
        ],
      },
    ],
  });
};

export default function FAQPage() {
  const { categories } = useLoaderData<typeof loader>();
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState<
    Record<number, boolean>
  >({});

  const toggleQuestion = (questionIndex: number) => {
    setActiveQuestions((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  return (
    <div className="bg-basePrimaryLight min-h-screen">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-basePrimaryLight to-basePrimary/10">
        <div className="container relative px-4 md:px-6 mx-auto py-16 md:py-20 lg:py-24">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="inline-block text-baseSecondary text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mt-4">
                Frequently Asked
              </h1>
              <span className="ml-2  text-baseSecondary text-5xl">
                Questions
              </span>
              <p className="mt-4 text-lg text-midGrey max-w-2xl mx-auto">
                Find answers to common questions about using Altruvist for both
                volunteers and charities
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Content Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-basePrimary">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Category Navigation */}
            <div className="lg:col-span-1">
              <div className="space-y-2 sticky top-24">
                {categories.map((category, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCategory(i)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      activeCategory === i
                        ? "bg-accentPrimary text-baseSecondary"
                        : "bg-basePrimaryLight text-baseSecondary hover:bg-accentPrimary/10"
                    }`}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Questions & Answers */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold mb-8 text-baseSecondary">
                  {categories[activeCategory].title}
                </h2>

                <div className="space-y-4">
                  {categories[activeCategory].questions.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="bg-basePrimaryLight rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(i)}
                        className="flex items-center justify-between w-full px-6 py-4 text-left"
                      >
                        <h3 className="font-medium text-baseSecondary">
                          {item.question}
                        </h3>
                        <svg
                          className={`w-5 h-5 text-baseSecondary transition-transform ${
                            activeQuestions[i] ? "transform rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </button>
                      <div
                        className={`px-6 overflow-hidden transition-all duration-300 ${
                          activeQuestions[i] ? "max-h-96 pb-6" : "max-h-0"
                        }`}
                      >
                        <p className="text-midGrey">{item.answer}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Can't Find Answer Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-baseSecondary/5">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4 text-baseSecondary">
              Can't Find Your Answer?
            </h2>
            <p className="text-midGrey mb-8">
              If you couldn't find the information you're looking for, our
              support team is here to help. Reach out to us via email or through
              our contact form.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@altruvist.org"
                className="inline-flex h-12 items-center justify-center rounded-md bg-accentPrimary px-8 text-sm font-medium text-baseSecondary shadow transition-colors hover:bg-accentPrimary/90 focus:outline-none focus:ring-2 focus:ring-accentPrimary focus:ring-offset-2"
              >
                Email Support
              </a>
              <a
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-md border border-accentPrimary bg-transparent px-8 text-sm font-medium text-accentPrimary shadow-sm transition-colors hover:bg-accentPrimary/10 focus:outline-none focus:ring-2 focus:ring-accentPrimary focus:ring-offset-2"
              >
                Contact Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="w-full py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-baseSecondary">
              Additional Resources
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              Explore these resources for more detailed information
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-basePrimary p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-all"
            >
              <div className="h-48 mb-6 overflow-hidden rounded-lg">
                <img
                  src="/volunteer-guide.png"
                  alt="Volunteer Guide"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-baseSecondary">
                Volunteer Guide
              </h3>
              <p className="text-midGrey mb-4">
                Comprehensive information for volunteers to make the most of
                their experience.
              </p>
              <a
                href="/volunteer-guide"
                className="text-accentPrimary hover:text-accentPrimaryDark transition-colors inline-flex items-center"
              >
                Learn more
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  ></path>
                </svg>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-basePrimary p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-all"
            >
              <div className="h-48 mb-6 overflow-hidden rounded-lg">
                <img
                  src="/charity-resources.png"
                  alt="Charity Resources"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-baseSecondary">
                Charity Resources
              </h3>
              <p className="text-midGrey mb-4">
                Tools, guides, and best practices to help your organization work
                with volunteers effectively.
              </p>
              <a
                href="/charity-resources"
                className="text-accentPrimary hover:text-accentPrimaryDark transition-colors inline-flex items-center"
              >
                Learn more
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  ></path>
                </svg>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-basePrimary p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-all"
            >
              <div className="h-48 mb-6 overflow-hidden rounded-lg">
                <img
                  src="/pulling-medicare.png"
                  alt="About Altruvist"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-baseSecondary">
                About Altruvist
              </h3>
              <p className="text-midGrey mb-4">
                Learn about our mission, how our platform works, and the impact
                we're making together.
              </p>
              <a
                href="/about"
                className="text-accentPrimary hover:text-accentPrimaryDark transition-colors inline-flex items-center"
              >
                Learn more
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  ></path>
                </svg>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
