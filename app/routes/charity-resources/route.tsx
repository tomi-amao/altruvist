import { MetaFunction, useLoaderData } from "react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import LandingHeader from "~/components/navigation/LandingHeader";
import Footer from "~/components/navigation/Footer";

export const meta: MetaFunction<typeof loader> = () => {
  return [
    { title: "Charity Resources | Altruvist" },
    {
      name: "description",
      content:
        "Resources, guides and best practices for nonprofits and charitable organizations using Altruvist to find skilled volunteers.",
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

export const loader = async () => {
  // Mock data for the resources sections
  return {
    benefits: [
      {
        title: "Skills On Demand",
        icon: "💼",
        description:
          "Access a global pool of professionals willing to share their expertise with your organization.",
      },
      {
        title: "Save Resources",
        icon: "💰",
        description:
          "Accomplish projects without the expense of hiring full-time staff or expensive consultants.",
      },
      {
        title: "Diverse Perspectives",
        icon: "🌎",
        description:
          "Work with experts from different backgrounds who bring fresh ideas to your challenges.",
      },
      {
        title: "Quick Turnaround",
        icon: "⏱️",
        description:
          "Find skilled help for time-sensitive projects through our efficient matching system.",
      },
    ],
    guides: [
      {
        title: "Creating Effective Task Listings",
        description:
          "How to craft clear, compelling task descriptions that attract the right volunteers",
        content: [
          "Use specific, descriptive titles (e.g., 'Design responsive email templates' rather than 'Help with marketing')",
          "Clearly define deliverables and expected outcomes",
          "Be transparent about time commitments and deadlines",
          "Specify the exact skills needed and any required experience level",
          "Explain how the work contributes to your mission",
          "Include any tools or software volunteers will need to use",
        ],
      },
      {
        title: "Onboarding Volunteers Successfully",
        description:
          "Best practices for welcoming and integrating volunteers into your projects",
        content: [
          "Schedule a kick-off meeting to align on expectations and answer questions",
          "Provide context about your organization and the broader impact of their work",
          "Create a resource document with essential information and contact details",
          "Set up clear communication channels and response time expectations",
          "Introduce them to relevant team members they'll be working with",
          "Consider creating templates or examples of similar work your organization has done",
        ],
      },
      {
        title: "Managing Remote Volunteers",
        description:
          "Tips for effectively coordinating volunteers who work remotely",
        content: [
          "Use project management tools to track progress and deadlines",
          "Schedule regular check-ins to provide feedback and answer questions",
          "Create clear processes for reviewing and approving work",
          "Set up collaboration tools that make remote work efficient",
          "Be mindful of time zone differences when scheduling meetings",
          "Document processes and decisions to keep everyone aligned",
        ],
      },
      {
        title: "Providing Meaningful Feedback",
        description:
          "How to give feedback that helps volunteers grow while improving your outcomes",
        content: [
          "Be specific about what worked well and what could be improved",
          "Frame feedback in terms of the project goals rather than personal preferences",
          "Provide feedback promptly so volunteers can implement changes",
          "Balance constructive criticism with genuine appreciation",
          "Ask for their input on the process and how it could be improved",
          "Offer resources for skill development if appropriate",
        ],
      },
    ],
    tools: [
      {
        name: "Project Management",
        options: [
          {
            title: "Asana",
            description:
              "Task management system perfect for assigning work to volunteers",
            url: "https://asana.com/nonprofits",
            discount: "Free for qualifying nonprofits",
          },
          {
            title: "Trello",
            description:
              "Visual project management with simple boards and cards",
            url: "https://trello.com/nonprofits",
            discount: "50% discount for nonprofits",
          },
          {
            title: "ClickUp",
            description:
              "All-in-one productivity platform with robust free plan",
            url: "https://clickup.com/nonprofits",
            discount: "Free for teams up to 5",
          },
        ],
      },
      {
        name: "Communication",
        options: [
          {
            title: "Slack",
            description:
              "Channel-based messaging platform for team communication",
            url: "https://slack.com/help/articles/204368833-Apply-for-the-Slack-for-Nonprofits-discount",
            discount: "85% discount for nonprofits",
          },
          {
            title: "Microsoft Teams",
            description: "Integrated communication and collaboration platform",
            url: "https://www.microsoft.com/en-us/nonprofits/microsoft-teams",
            discount: "Free for qualifying nonprofits",
          },
          {
            title: "Zoom",
            description: "Video conferencing for virtual meetings and webinars",
            url: "https://zoom.us/nonprofits",
            discount: "50% discount for nonprofits",
          },
        ],
      },
      {
        name: "Design & Content",
        options: [
          {
            title: "Canva",
            description: "Easy-to-use graphic design platform with templates",
            url: "https://www.canva.com/canva-for-nonprofits/",
            discount: "Free premium version for nonprofits",
          },
          {
            title: "Adobe Creative Cloud",
            description: "Professional design tools for all creative needs",
            url: "https://www.adobe.com/creativecloud/nonprofits.html",
            discount: "60% discount for nonprofits",
          },
          {
            title: "Loom",
            description:
              "Video messaging tool for quick tutorials and feedback",
            url: "https://www.loom.com/pricing",
            discount: "Free plan available for basic needs",
          },
        ],
      },
    ],
    faq: [
      {
        question: "How do I verify my nonprofit status on Altruvist?",
        answer:
          "During registration, select 'Charity' as your organization type and provide your nonprofit registration number. Our team will verify your status within 1-2 business days. For expedited verification, you can email supporting documentation to verification@Altruvist.org.",
      },
      {
        question: "Can we have multiple accounts for different departments?",
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
    ],
  };
};

export default function CharityResources() {
  const { benefits, guides, tools, faq } = useLoaderData<typeof loader>();
  const [activeGuide, setActiveGuide] = useState<number>(0);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-basePrimaryLight">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-basePrimaryLight to-basePrimary/10">
        <div className="container px-4 sm:px-6 mx-auto py-12 md:py-16 lg:py-24">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-baseSecondary">
                <span className="inline-block">Charity</span>
                <span className="ml-2 font-light">Resources</span>
              </h1>
              <p className="mt-4 text-base md:text-lg text-midGrey max-w-2xl mx-auto">
                Tools, guides, and best practices to help your organization make
                the most of skilled volunteers on the Altruvist platform.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-8 md:mt-12"
            >
              <img
                src="/charity-resources.png"
                alt="Charity work in action"
                className="w-full h-auto max-w-2xl mx-auto rounded-xl shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-basePrimary">
        <div className="container px-4 sm:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-baseSecondary">
              Benefits of Skilled Volunteering
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey mt-4 text-base md:text-lg">
              How skilled volunteers can transform your organization
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-basePrimaryLight p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-4 mx-auto">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-baseSecondary">
                  {benefit.title}
                </h3>
                <p className="text-midGrey">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Practices Section */}
      <section className="w-full py-12 md:py-16 lg:py-20">
        <div className="container px-4 sm:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-baseSecondary">
              Best Practices & Guides
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey mt-4 text-base md:text-lg">
              Expert advice to help you get the most from skilled volunteers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
            {/* Guide Tabs - Vertical on larger screens, horizontal scrolling on mobile */}
            <div className="lg:col-span-1 overflow-x-auto lg:overflow-x-visible">
              <div className="flex lg:flex-col space-x-4 lg:space-x-0 lg:space-y-2 pb-4 lg:pb-0 lg:sticky lg:top-24">
                {guides.map((guide, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveGuide(i)}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg transition-colors whitespace-nowrap lg:whitespace-normal ${
                      activeGuide === i
                        ? "bg-accentPrimary text-baseSecondary"
                        : "bg-basePrimary text-baseSecondary hover:bg-accentPrimary/10"
                    }`}
                  >
                    {guide.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Guide Content */}
            <div className="lg:col-span-4 bg-basePrimary p-6 md:p-8 rounded-xl">
              {guides.map((guide, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: activeGuide === i ? 1 : 0,
                    display: activeGuide === i ? "block" : "none",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl md:text-2xl font-bold mb-2 text-baseSecondary">
                    {guide.title}
                  </h3>
                  <p className="text-midGrey mb-6">{guide.description}</p>

                  <ul className="space-y-3 md:space-y-4">
                    {guide.content.map((item, j) => (
                      <li key={j} className="flex items-start">
                        <span className="text-accentPrimary mr-3 mt-1">•</span>
                        <span className="text-midGrey">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nonprofit Tools Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-basePrimary">
        <div className="container px-4 sm:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-baseSecondary">
              Tools for Nonprofits
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey mt-4 text-base md:text-lg">
              Discounted and free software to enhance your collaboration with
              volunteers
            </p>
          </motion.div>

          <div className="space-y-8 md:space-y-12">
            {tools.map((category, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-baseSecondary border-b border-accentPrimary/20 pb-2">
                  {category.name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {category.options.map((tool, j) => (
                    <div
                      key={j}
                      className="bg-basePrimaryLight p-5 md:p-6 rounded-lg shadow-sm border border-basePrimary/20 hover:shadow-md transition-all"
                    >
                      <h4 className="text-lg md:text-xl font-bold mb-2 text-baseSecondary">
                        {tool.title}
                      </h4>
                      <p className="text-midGrey mb-4 text-sm md:text-base">
                        {tool.description}
                      </p>
                      <div className="text-sm font-medium mb-3 text-baseSecondary/80">
                        {tool.discount}
                      </div>
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-baseSecondary hover:text-accentPrimary transition-colors inline-flex items-center text-sm md:text-base"
                      >
                        Learn more
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-12 md:py-16 lg:py-20">
        <div className="container px-4 sm:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-10"
          >
            <h2
              id="faq"
              className="text-3xl md:text-4xl font-bold text-baseSecondary"
            >
              Frequently Asked Questions
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey mt-4 text-base md:text-lg">
              Common questions about using Altruvist for your organization
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
                className="bg-basePrimary rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(i)}
                  className="flex items-center justify-between w-full px-4 sm:px-6 py-4 text-left"
                  aria-expanded={activeQuestion === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <h3 className="font-medium text-baseSecondary text-sm md:text-base">
                    {item.question}
                  </h3>
                  <svg
                    className={`w-5 h-5 text-baseSecondary transition-transform ${
                      activeQuestion === i ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  id={`faq-answer-${i}`}
                  className={`px-4 sm:px-6 overflow-hidden transition-all duration-300 ${
                    activeQuestion === i ? "max-h-96 pb-6" : "max-h-0"
                  }`}
                >
                  <p className="text-midGrey text-sm md:text-base">
                    {item.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-baseSecondary">
        <div className="container px-4 sm:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8"
          >
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-basePrimary">
                Ready to find skilled volunteers?
              </h2>
              <p className="mt-4 text-basePrimaryLight max-w-md mx-auto md:mx-0">
                Join Altruvist today and connect with professionals ready to
                share their expertise with your organization.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/zitlogin"
                className="inline-flex h-10 md:h-12 items-center justify-center rounded-md bg-accentPrimary px-6 md:px-8 text-sm font-medium text-baseSecondary shadow transition-colors hover:bg-accentPrimary/90 focus:outline-none focus:ring-2 focus:ring-accentPrimary focus:ring-offset-2"
              >
                Register Your Charity
              </a>
              <a
                href="/contact"
                className="inline-flex h-10 md:h-12 items-center justify-center rounded-md border border-basePrimaryLight bg-transparent px-6 md:px-8 text-sm font-medium text-basePrimaryLight shadow-sm transition-colors hover:bg-basePrimaryLight/10 focus:outline-none focus:ring-2 focus:ring-basePrimaryLight focus:ring-offset-2"
              >
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
