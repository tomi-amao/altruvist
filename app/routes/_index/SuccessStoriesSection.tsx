import { motion } from "framer-motion";
import {
  Target,
  Users,
  Clock,
  Trophy,
  Buildings,
  Link,
} from "@phosphor-icons/react";

export const SuccessStoriesSection = () => {
  return (
    <>
      {/* Case Studies Section */}
      <section className="py-20 bg-gradient-to-b from-baseSecondary to-baseSecondary/70 text-basePrimary">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4 text-accentPrimary/80">
              Success Stories
            </h2>
            <div className="w-24 h-1 bg-accentSecondary mx-auto mb-6"></div>
            <p className="text-lg max-w-xl mx-auto">
              See how volunteers have transformed charities through their
              digital expertise.
            </p>
          </motion.div>

          {/* Case Studies Cards */}
          <div className="max-w-7xl mx-auto">
            {/* Large featured case study */}
            <motion.div
              className="mb-16 bg-baseSecondary rounded-2xl overflow-hidden shadow-xl"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <span className="text-sm font-semibold text-accentSecondary mb-4 uppercase tracking-wider">
                    Featured Case Study
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-accentPrimary">
                    Wildlife Conservation Dashboard
                  </h3>

                  <p className="mb-6 text-basePrimary">
                    A team of data scientists and frontend developers created an
                    interactive dashboard helping GlobalWild track endangered
                    species across 20 countries.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex items-center">
                      <Target size={20} className="text-accentSecondary mr-2" />
                      <span className="text-sm">250+ species tracked</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={20} className="text-accentSecondary mr-2" />
                      <span className="text-sm">5 volunteers</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={20} className="text-accentSecondary mr-2" />
                      <span className="text-sm">3 months</span>
                    </div>
                  </div>

                  <motion.button
                    className="group flex items-center text-accentPrimary font-medium"
                    whileHover={{ x: 5 }}
                  >
                    Read full case study
                    <svg
                      className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
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
                  </motion.button>
                </div>

                <div className="relative overflow-hidden min-h-[300px]">
                  <img
                    src="/nature-tiger.png"
                    alt="Wildlife Conservation Dashboard"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-accentPrimary/40 to-transparent mix-blend-overlay"></div>

                  {/* Testimonial overlay */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-basePrimary/80 via-basePrimary/50 to-transparent p-6"
                    initial={{ y: 100, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.7 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accentPrimary/20 overflow-hidden flex-shrink-0">
                        <img
                          src="/avatar-person.png"
                          alt="Dr. Sarah Chen"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-baseSecondary italic mb-2">
                          &ldquo;The volunteer team&apos;s work revolutionized
                          how we track endangered species. What would have cost
                          us $50,000+ was done with passion and
                          expertise.&rdquo;
                        </p>
                        <p className="text-baseSecondary font-medium">
                          Dr. Sarah Chen, Conservation Director at GlobalWild
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Smaller case studies */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Digital Fundraising Platform",
                  charity: "Children's Hope Foundation",
                  impact: "42% increase in online donations",
                  image: "/charity-kids.png",
                  color: "from-accentPrimary/20 to-accentPrimary/5",
                },
                {
                  title: "Volunteer Management System",
                  charity: "Disaster Relief Network",
                  impact: "1,200+ volunteers coordinated",
                  image: "/firehelp-team.png",
                  color: "from-accentSecondary/20 to-accentSecondary/5",
                },
                {
                  title: "Accessible Website Redesign",
                  charity: "Ability Alliance",
                  impact: "98% accessibility score achieved",
                  image: "/medical-accessible.png",
                  color: "from-confirmPrimary/20 to-confirmPrimary/5",
                },
              ].map((caseStudy, index) => (
                <motion.div
                  key={index}
                  className="bg-baseSecondary rounded-xl overflow-hidden shadow-lg border border-basePrimary/10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.6 }}
                  whileHover={{
                    y: -8,
                    boxShadow:
                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <div
                    className={`h-48 relative overflow-hidden bg-gradient-to-br ${caseStudy.color}`}
                  >
                    <img
                      src={caseStudy.image}
                      alt={caseStudy.title}
                      className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-basePrimary to-transparent opacity-60"
                      whileHover={{ opacity: 0.4 }}
                    ></motion.div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-accentPrimary">
                      {caseStudy.title}
                    </h3>
                    <p className="text-sm text-basePrimary mb-4">
                      {caseStudy.charity}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="bg-accentPrimary/10 text-accentPrimary px-3 py-1 rounded-full text-sm font-medium">
                        {caseStudy.impact}
                      </span>

                      <motion.button
                        className="text-accentPrimary"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg
                          className="w-6 h-6"
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
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Interactive Impact Counter */}
            <motion.div
              className="mt-16 p-8 bg-accentPrimary/10 rounded-xl border border-accentPrimary"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-accentPrimary mb-2">
                  Combined Impact
                </h3>
                <p className="text-basePrimary">
                  Our case studies demonstrate the tangible difference skilled
                  volunteers make
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  {
                    value: "$1.2M",
                    label: "Value of Work Donated",
                    icon: <Trophy size={28} weight="fill" />,
                  },
                  {
                    value: "2,500+",
                    label: "Volunteer Hours",
                    icon: <Clock size={28} weight="fill" />,
                  },
                  {
                    value: "45+",
                    label: "Projects Completed",
                    icon: <Target size={28} weight="fill" />,
                  },
                  {
                    value: "32",
                    label: "Charities Supported",
                    icon: <Buildings size={28} weight="fill" />,
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <div className="w-14 h-14 rounded-full bg-accentPrimary/20 flex items-center justify-center mb-3 text-accentPrimary">
                      {stat.icon}
                    </div>
                    <motion.div
                      className="text-2xl md:text-3xl font-bold text-accentPrimary"
                      initial={{ scale: 0.8 }}
                      whileInView={{ scale: [0.8, 1.2, 1] }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 0.3 + index * 0.1,
                        duration: 0.6,
                        ease: "easeOut",
                      }}
                    >
                      {stat.value}
                    </motion.div>
                    <p className="text-sm text-basePrimary mt-1">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mt-8 text-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/case-studies"
                  className="inline-block px-8 py-3 bg-accentPrimary text-baseSecondary rounded-lg font-medium hover:bg-accentPrimaryDark transition-colors"
                >
                  Explore All Case Studies
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};
