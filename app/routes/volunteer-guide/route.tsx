import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { motion } from "framer-motion";
import { useState } from "react";
import LandingHeader from "~/components/navigation/LandingHeader";
import Footer from "~/components/navigation/Footer";
import { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Volunteer Guide | Altruist" },
    {
      name: "description",
      content:
        "A comprehensive guide for volunteers on how to make the most of your volunteering experience with Altruist.",
    },
  ];
};

export const loader = async () => {
  // Mock data for the guide sections
  return json({
    steps: [
      {
        title: "Create Your Profile",
        icon: "👤",
        description:
          "Sign up and complete your profile with skills, interests, and availability to help us match you with the right opportunities.",
        tips: [
          "Add a professional photo to make your profile more approachable",
          "Be specific about your skills - the more detailed, the better the matches",
          "Keep your availability up to date to receive relevant opportunities",
        ],
      },
      {
        title: "Find Opportunities",
        icon: "🔍",
        description:
          "Browse available tasks that match your skills and interests, or wait for our matching algorithm to suggest opportunities.",
        tips: [
          "Use filters to narrow down opportunities by cause, skill required, or time commitment",
          "Set up notifications to be alerted when new opportunities matching your profile are posted",
          "Consider starting with smaller tasks to build your reputation",
        ],
      },
      {
        title: "Apply & Connect",
        icon: "🤝",
        description:
          "Submit your application for projects you're interested in and connect with the organization to learn more.",
        tips: [
          "Personalize your application message to explain why you're a good fit",
          "Be responsive to messages from organizations",
          "Don't overcommit - only apply for tasks you know you can complete",
        ],
      },
      {
        title: "Complete & Track Impact",
        icon: "🌟",
        description:
          "Complete your assigned tasks and track your social impact over time on your personalized dashboard.",
        tips: [
          "Keep the organization updated on your progress",
          "Meet deadlines and communicate proactively if you need more time",
          "Ask for feedback after completing a task to improve your skills",
        ],
      },
    ],
    faq: [
      {
        question: "How much time do I need to commit?",
        answer:
          "Time commitments vary by opportunity. Some tasks might require just a few hours, while others might be ongoing projects spanning several weeks. You can filter opportunities based on your availability and only commit to what fits your schedule.",
      },
      {
        question: "Do I need special skills to volunteer?",
        answer:
          "Altruist specializes in skills-based volunteering, so having specific skills (especially digital or professional skills) is helpful. However, we have opportunities for various skill levels, from beginners to experts.",
      },
      {
        question: "Can I volunteer remotely?",
        answer:
          "Yes! Many opportunities on Altruist are remote/virtual, allowing you to contribute from anywhere in the world. You can filter opportunities by location type to find remote-friendly tasks.",
      },
      {
        question: "Will I receive training?",
        answer:
          "This depends on the specific opportunity. Some organizations provide training, while others require volunteers to already possess certain skills. Each listing specifies any training provided.",
      },
      {
        question: "How do I track my impact?",
        answer:
          "Your Altruist dashboard automatically tracks your completed tasks, hours contributed, and the causes you've supported. This creates a comprehensive record of your volunteering journey.",
      },
      {
        question: "Can I volunteer as a team or with my company?",
        answer:
          "Yes! Many organizations welcome team volunteering. Contact us directly for corporate volunteering opportunities or to coordinate team-based projects.",
      },
    ],
    tips: [
      {
        title: "Communication is Key",
        description:
          "Maintain clear and regular communication with the organization. If you're running late, need clarification, or can't complete a task, let them know as soon as possible.",
      },
      {
        title: "Manage Your Time",
        description:
          "Be realistic about your availability and only commit to what you can deliver. It's better to excel at one project than to underperform on several.",
      },
      {
        title: "Keep Learning",
        description:
          "Use each volunteer opportunity to develop new skills and knowledge. Ask for feedback and be open to constructive criticism.",
      },
      {
        title: "Document Your Work",
        description:
          "Keep samples of your volunteer work (when appropriate and with permission) to showcase your skills and impact in the future.",
      },
      {
        title: "Build Relationships",
        description:
          "Volunteering is a great way to network and build professional relationships. Connect with other volunteers and organization staff on professional networks.",
      },
    ],
  });
};

export default function VolunteerGuide() {
  const { steps, faq, tips } = useLoaderData<typeof loader>();
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);

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
                Volunteer{" "}
                <span className="text-baseSecondary text-6xl">Guide</span>
              </h1>
              <p className="mt-4 text-lg text-midGrey max-w-2xl mx-auto">
                Everything you need to know to make the most of your
                volunteering experience with Altruist.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-12"
            >
              <img
                src="/volunteer-guide.png"
                alt="Volunteers collaborating"
                className="w-full h-auto max-w-2xl mx-auto rounded-xl shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-basePrimary">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2
              id="how-it-works"
              className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-baseSecondary"
            >
              How to Volunteer
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              Follow these simple steps to make a difference with your skills
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-accentPrimary/30 -translate-y-1/2 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-basePrimaryLight p-6 rounded-xl shadow-sm relative"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-accentPrimary text-2xl mb-4 mx-auto md:mx-0">
                    {step.icon}
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-baseSecondary text-basePrimary flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-baseSecondary text-center md:text-left">
                    {step.title}
                  </h3>
                  <p className="text-midGrey mb-4 text-center md:text-left">
                    {step.description}
                  </p>
                  <div className="mt-4 bg-basePrimary/50 p-3 rounded-lg">
                    <p className="font-medium text-baseSecondary text-sm mb-2">
                      Pro Tips:
                    </p>
                    <ul className="space-y-2 text-sm">
                      {step.tips.map((tip, j) => (
                        <li key={j} className="flex items-start">
                          <span className="text-accentPrimary mr-2 mt-0.5">
                            •
                          </span>
                          <span className="text-midGrey">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Volunteering Tips */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-baseSecondary/5">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-baseSecondary">
              Best Practices for Volunteers
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              Tips to help you succeed in your volunteering journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-basePrimary p-6 rounded-xl shadow-sm border border-basePrimary/20"
              >
                <h3 className="text-xl font-bold mb-3 text-accentPrimary">
                  {tip.title}
                </h3>
                <p className="text-midGrey">{tip.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-basePrimary">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2
              id="faq"
              className="text-3xl font-bold tracking-tighter sm:text-4xl text-baseSecondary"
            >
              Frequently Asked Questions
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              Answers to common questions about volunteering with Altruist
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faq.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                viewport={{ once: true }}
                className="bg-basePrimaryLight rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setActiveQuestion(activeQuestion === i ? null : i)
                  }
                  className="flex items-center justify-between w-full px-6 py-4 text-left"
                >
                  <h3 className="font-medium text-baseSecondary">
                    {item.question}
                  </h3>
                  <svg
                    className={`w-5 h-5 text-baseSecondary transition-transform ${
                      activeQuestion === i ? "transform rotate-180" : ""
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
                    activeQuestion === i ? "max-h-96 pb-6" : "max-h-0"
                  }`}
                >
                  <p className="text-midGrey">{item.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-baseSecondary">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-basePrimary">
                Ready to make a difference?
              </h2>
              <p className="mt-4 text-basePrimaryLight max-w-md mx-auto md:mx-0">
                Join our community of volunteers making an impact in communities
                around the world.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/explore"
                className="inline-flex h-12 items-center justify-center rounded-md bg-accentPrimary px-8 text-sm font-medium text-baseSecondary shadow transition-colors hover:bg-accentPrimary/90 focus:outline-none focus:ring-2 focus:ring-accentPrimary focus:ring-offset-2"
              >
                Find Opportunities
              </a>
              <a
                href="/zitlogin"
                className="inline-flex h-12 items-center justify-center rounded-md border border-basePrimaryLight bg-transparent px-8 text-sm font-medium text-basePrimaryLight shadow-sm transition-colors hover:bg-basePrimaryLight/10 focus:outline-none focus:ring-2 focus:ring-basePrimaryLight focus:ring-offset-2"
              >
                Sign Up Today
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
