import { MetaFunction, useLoaderData } from "react-router";
import { motion } from "framer-motion";
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
  // This could fetch data from your database if needed
  return {
    stats: [
      { value: "5,000+", label: "Volunteers" },
      { value: "850+", label: "Organizations" },
      { value: "3,200+", label: "Completed Tasks" },
      { value: "75,000+", label: "Hours Donated" },
    ],
    team: [
      {
        name: "Ignorant View",
        role: "Founder",
        image: "/public/iv 1.PNG",
      },
    ],
    testimonials: [
      {
        quote:
          "Altruvist has transformed how our organization connects with volunteers who are passionate about our cause.",
        author: "Jane Doe",
        title: "Director, Ocean Conservation Trust",
      },
      {
        quote:
          "I've found meaningful ways to contribute my skills and time to causes I care about, from mentoring youth to helping with community gardens.",
        author: "Marcus Lee",
        title: "Marketing Specialist & Volunteer",
      },
      {
        quote:
          "The platform made it easy to find volunteers with diverse skills for our annual fundraiser. We'll definitely use it again!",
        author: "Sarah Chen",
        title: "Events Coordinator, Local Food Bank",
      },
    ],
    volunteering: [
      {
        category: "Community Support",
        icon: "🏘️",
        examples: [
          "Neighborhood cleanup",
          "Food bank assistance",
          "Elderly support",
        ],
      },
      {
        category: "Education",
        icon: "📚",
        examples: ["Tutoring", "Workshop facilitation", "Library assistance"],
      },
      {
        category: "Environment",
        icon: "🌱",
        examples: [
          "Conservation projects",
          "Community gardens",
          "Sustainability initiatives",
        ],
      },
      {
        category: "Professional Skills",
        icon: "💼",
        examples: ["Marketing help", "Website development", "Legal advice"],
      },
      {
        category: "Healthcare",
        icon: "🩺",
        examples: [
          "Medical outreach",
          "Mental health support",
          "Wellness programs",
        ],
      },
      {
        category: "Arts & Culture",
        icon: "🎨",
        examples: [
          "Event organization",
          "Performance",
          "Historical preservation",
        ],
      },
    ],
  };
};

export default function AboutRoute() {
  const { stats, team, volunteering } = useLoaderData<typeof loader>();
  // const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="bg-basePrimaryLight min-h-screen">
      <LandingHeader />

      {/* Hero Section - About Page Focused */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-basePrimaryLight to-basePrimary/10">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute w-full h-full bg-[radial-gradient(circle_at_10%_20%,rgba(0,0,0,0.2)_0%,transparent_20%)]"></div>
          <div className="absolute w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.2)_0%,transparent_20%)]"></div>
        </div>

        <div className="container relative px-4 md:px-6 mx-auto py-16 md:py-20 lg:py-24">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h1 className="inline-block text-baseSecondary text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mt-14">
                About Altruvist
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-basePrimary rounded-xl shadow-xl overflow-hidden mb-12"
            >
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-10 flex items-center">
                  <div className="space-y-4">
                    <h2 className="text-2xl md:text-3xl font-semibold text-baseSecondary">
                      Our Purpose
                    </h2>
                    <p className="text-midGrey text-lg leading-relaxed">
                      Founded in 2025, Altruvist connects volunteers with
                      meaningful opportunities to make a difference in their
                      communities. We believe in the power of collective action
                      and that everyone has valuable skills to contribute.
                    </p>
                    <div className="pt-2">
                      <div className="inline-flex items-center px-4 py-2 bg-baseSecondary/10 rounded-lg text-baseSecondary font-medium">
                        Empowering Communities Together
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative h-64 md:h-auto overflow-hidden">
                  <img
                    src="/wheelchair-drawing.png"
                    alt="Volunteers making a difference"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            ></motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-basePrimary">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-baseSecondary">
              Our Values
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Inclusivity",
                description:
                  "We believe everyone has valuable skills to share, regardless of background or experience level.",
                icon: "❤️",
              },
              {
                title: "Impact",
                description:
                  "We focus on creating measurable, meaningful change in communities through effective volunteer matching.",
                icon: "🌟",
              },
              {
                title: "Collaboration",
                description:
                  "We foster partnership between volunteers, organizations, and communities to solve challenges together.",
                icon: "🤝",
              },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-basePrimaryLight p-8 rounded-xl text-center"
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-baseSecondary">
                  {value.title}
                </h3>
                <p className="text-midGrey">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-basePrimary">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-baseSecondary">
                  Our Mission
                </h2>
                <p className="text-midGrey text-lg">
                  We're on a mission to create a world where people's time,
                  energy, and skills are shared freely with those working to
                  address social, environmental, and community challenges.
                </p>
                <ul className="space-y-2 text-midGrey">
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-confirmPrimary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Support organizations with diverse volunteer resources
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-confirmPrimary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Provide meaningful volunteer opportunities that fit any
                      schedule and skill set
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-confirmPrimary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Build stronger communities through effective volunteer
                      matching
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }} // or x: 0 for no horizontal movement
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative w-full h-full min-h-[300px]"
            >
              <div className="absolute inset-0 bg-accentPrimary rounded-xl flex items-center justify-center">
                <div className="text-center p-8">
                  <h3 className="text-2xl font-bold mb-4 text-baseSecondary">
                    Our Impact
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                        viewport={{ once: true }}
                        className="p-4 bg-basePrimaryLight rounded-lg shadow-sm"
                      >
                        <p className="md:text-2xl text-xl font-bold text-baseSecondary">
                          {stat.value}
                        </p>
                        <p className="text-xs md:text-sm text-midGrey">
                          {stat.label}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Volunteering Categories Section */}
      <section className="w-full py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-baseSecondary">
              Volunteering Opportunities
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              Discover the diverse ways you can contribute
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {volunteering.map((category, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-basePrimary p-6 rounded-xl shadow-sm"
              >
                <div className="text-3xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-baseSecondary">
                  {category.category}
                </h3>
                <ul className="text-midGrey space-y-2">
                  {category.examples.map((example, j) => (
                    <li key={j} className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-accentPrimary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {example}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
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
              How Altruvist Works
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              A simple process to connect volunteers with organizations
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-accentPrimary/30 -translate-y-1/2 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  title: "Organizations Post Tasks",
                  description:
                    "Organizations post specific tasks requiring volunteer help, from one-time events to ongoing support",
                  icon: "📋",
                },
                {
                  title: "Volunteers Apply",
                  description:
                    "Volunteers browse and apply for opportunities that match their interests, skills, and schedule",
                  icon: "🤝",
                },
                {
                  title: "Community Impact",
                  description:
                    "Work together to complete tasks, track progress, and create meaningful change in communities",
                  icon: "✨",
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center text-center bg-basePrimaryLight p-6 rounded-xl"
                >
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-accentPrimary text-3xl mb-4 border-4 border-basePrimaryLight">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-baseSecondary">
                    {step.title}
                  </h3>
                  <p className="text-midGrey">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {/* <section className="w-full py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-baseSecondary">
              What People Say
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              Hear from our community of volunteers and organizations
            </p>
          </motion.div>

          <div className="relative w-full max-w-3xl mx-auto bg-basePrimary rounded-xl p-8 shadow-sm">
            <div className="relative min-h-[200px]">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i === activeTestimonial ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg 
                    className="w-12 h-12 mb-4 text-accentPrimary/30" 
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <blockquote className="mb-4 text-lg italic text-midGrey">
                    "{testimonial.quote}"
                  </blockquote>
                  <cite className="text-baseSecondary font-semibold">
                    {testimonial.author}
                  </cite>
                  <p className="text-sm text-altMidGrey">{testimonial.title}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center space-x-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`w-3 h-3 rounded-full ${
                    i === activeTestimonial
                      ? "bg-baseSecondary"
                      : "bg-lightGrey"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* Team Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-basePrimaryLight">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-baseSecondary">
              Our Team
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              Meet the people behind Altruvist
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center bg-basePrimaryLight p-6 rounded-xl"
              >
                <div className="w-28 h-28 rounded-full overflow-hidden mb-4 bg-lightGrey">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-baseSecondary">
                  {member.name}
                </h3>
                <p className="text-midGrey">{member.role}</p>
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
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-txtsecondary">
                Ready to make a difference?
              </h2>
              <p className="mt-4 text-basePrimaryLight max-w-md mx-auto md:mx-0">
                Join our community of volunteers making an impact in communities
                around the world.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/zitlogin"
                className="inline-flex h-12 items-center justify-center rounded-md bg-basePrimaryLight px-8 text-sm font-medium text-baseSecondary shadow transition-colors hover:bg-basePrimaryDark focus:outline-none focus:ring-2 focus:ring-accentPrimary focus:ring-offset-2"
              >
                Sign Up
              </a>
              <a
                href="/explore/tasks"
                className="inline-flex h-12 items-center justify-center rounded-md border border-basePrimaryLight bg-transparent px-8 text-sm font-medium text-txtsecondary shadow-sm transition-colors hover:bg-accentPrimary/10 focus:outline-none focus:ring-2 focus:ring-accentPrimary focus:ring-offset-2"
              >
                Browse Opportunities
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
