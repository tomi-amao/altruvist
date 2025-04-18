import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { motion } from "framer-motion";
import { useState } from "react";
import LandingHeader from "~/components/navigation/LandingHeader";

export const loader = async () => {
  // This could fetch data from your database if needed
  return json({
    stats: [
      { value: "2,500+", label: "Volunteers" },
      { value: "350+", label: "Charities" },
      { value: "1,200+", label: "Completed Tasks" },
      { value: "30,000+", label: "Hours Donated" },
    ],
    team: [
      {
        name: "Alex Johnson",
        role: "Founder",
        image: "/images/placeholder-profile.png",
      },
      {
        name: "Sam Richards",
        role: "Chief Technology Officer",
        image: "/images/placeholder-profile.png",
      },
      {
        name: "Taylor Smith",
        role: "Community Manager",
        image: "/images/placeholder-profile.png",
      },
    ],
    testimonials: [
      {
        quote:
          "Altruvist has transformed how we find skilled volunteers for our technical needs.",
        author: "Jane Doe",
        title: "Director, Ocean Conservation Trust",
      },
      {
        quote:
          "As a web developer, I've found meaningful ways to contribute my skills to causes I care about.",
        author: "Marcus Lee",
        title: "Frontend Developer & Volunteer",
      },
    ],
  });
};

export default function AboutRoute() {
  const { stats, team, testimonials } = useLoaderData<typeof loader>();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="bg-basePrimaryLight">
      <LandingHeader />
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 overflow-hidden ">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center space-y-4 text-center"
          >
            <div className="space-y-2 mb-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-baseSecondary">
                About Altruvist
              </h1>
              <p className="mx-auto max-w-[700px] text-midGrey md:text-xl">
                Connecting skilled volunteers with charities that need their
                expertise
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full max-w-3xl rounded-lg overflow-hidden"
            >
              <div className="bg-accentPrimary p-8 rounded-xl">
                <p className="text-lg text-midGrey leading-relaxed">
                  Altruvist is a platform that bridges the gap between skilled
                  professionals and charitable organizations. We believe
                  everyone has valuable skills that can make a difference, and
                  we make it easy to donate those skills to causes that matter.
                </p>
              </div>
            </motion.div>
          </motion.div>
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
                  We&apos;re on a mission to create a world where professional
                  skills are shared freely with those working to solve our most
                  pressing social and environmental challenges.
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
                    <span>Empower charities with professional expertise</span>
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
                      Provide meaningful volunteer opportunities for skilled
                      professionals
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
                      Maximize social impact through efficient skill matching
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
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
                        <p className="text-3xl font-bold text-baseSecondary">
                          {stat.value}
                        </p>
                        <p className="text-sm text-midGrey">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
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
              How Altruvist Works
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              A simple process to connect skills with needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Charities Post Tasks",
                description:
                  "Charitable organizations post specific tasks requiring professional skills",
                icon: "📋",
              },
              {
                title: "Volunteers Apply",
                description:
                  "Skilled volunteers browse and apply for tasks matching their expertise",
                icon: "🤝",
              },
              {
                title: "Collaboration",
                description:
                  "Work together to complete tasks and track progress on our platform",
                icon: "✨",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-accentPrimary text-3xl mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-baseSecondary">
                  {step.title}
                </h3>
                <p className="text-midGrey">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-basePrimary">
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
          </motion.div>

          <div className="relative w-full max-w-2xl mx-auto overflow-hidden">
            <div className="relative h-64">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i === activeTestimonial ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <blockquote className="mb-4 text-lg italic text-midGrey">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <cite className="text-baseSecondary font-semibold">
                    {testimonial.author}
                  </cite>
                  <p className="text-sm text-altMidGrey">{testimonial.title}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center space-x-2 mt-4">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`w-3 h-3 rounded-full ${
                    i === activeTestimonial
                      ? "bg-basestext-baseSecondary"
                      : "bg-lightGrey"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
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
              Our Team
            </h2>
            <p className="mx-auto max-w-[700px] text-midGrey md:text-xl mt-4">
              Meet the people behind Altruvist
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 bg-lightGrey">
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
                Ready to share your skills?
              </h2>
              <p className="mt-4 text-basePrimaryLight max-w-md mx-auto md:mx-0">
                Join our community of skilled volunteers making a difference by
                donating their expertise to worthy causes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/zitlogin"
                className="inline-flex h-10 items-center justify-center rounded-md bg-basePrimaryLight px-8 text-sm font-medium text-baseSecondary shadow transition-colors hover:bg-basePrimaryDark focus:outline-none focus:ring-2 focus:ring-accentPrimary focus:ring-offset-2"
              >
                Sign Up
              </a>
              <a
                href="/explore"
                className="inline-flex h-10 items-center justify-center rounded-md border border-basePrimaryLight bg-transparent px-8 text-sm font-medium text-txtsecondary shadow-sm transition-colors hover:bg-accentPrimary/10 focus:outline-none focus:ring-2 focus:ring-accentPrimary focus:ring-offset-2"
              >
                Browse Tasks
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
