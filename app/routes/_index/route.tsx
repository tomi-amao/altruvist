import {
  Link,
  useLoaderData,
  useNavigate,
  LoaderFunctionArgs,
  MetaFunction,
  data,
} from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import LandingHeader from "~/components/navigation/LandingHeader";
import type { Task } from "~/types/tasks";
import Notification from "~/components/cards/NotificationCard";
import { commitSession, getSession } from "~/services/session.server";
import { subDays } from "date-fns";
import { prisma } from "~/services/db.server";
import { getUserInfo } from "~/models/user2.server";
import Footer from "~/components/navigation/Footer";
import TaskDetailsCard from "~/components/tasks/taskDetailsCard";
import { Modal } from "~/components/utils/Modal2";
import {
  Buildings,
  MagnifyingGlass,
  Heart,
  Users,
  Lightbulb,
  Globe,
  ArrowRight,
  Handshake,
  TrendUp,
  Shield,
  Lock,
  ChartLine,
  Coins,
  User,
} from "@phosphor-icons/react";
import { users } from "@prisma/client";
import { getSignedUrlForFile } from "~/services/s3.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Altruvist" },
    {
      name: "description",
      content:
        "Donate your digital skills to make a difference. Join Altruvist today!",
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const flashError = session.get("error");

  // Get the date 30 days ago for recency filtering
  const thirtyDaysAgo = subDays(new Date(), 30);

  // Fetch tasks with popularity metrics
  const recentTasks = await prisma.tasks.findMany({
    take: 3,
    where: {
      OR: [{ urgency: "HIGH" }, { createdAt: { gte: thirtyDaysAgo } }],
    },
    include: {
      charity: { select: { name: true } },
      taskApplications: { select: { id: true } },
      _count: { select: { taskApplications: true } },
    },
    orderBy: [{ taskApplications: { _count: "desc" } }, { createdAt: "desc" }],
  });

  function calculatePopularityScore(task: {
    createdAt: Date;
    urgency: "HIGH" | "MEDIUM" | "LOW";
    _count: { taskApplications: number };
  }) {
    const recencyScore = calculateRecencyScore(task.createdAt);
    const applicationScore = task._count.taskApplications * 2;
    const urgencyScores: Record<"HIGH" | "MEDIUM" | "LOW", number> = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return recencyScore + applicationScore + urgencyScores[task.urgency];
  }

  // Helper function to calculate recency score
  function calculateRecencyScore(createdAt: Date): number {
    const ageInDays = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return ageInDays <= 7 ? 5 : ageInDays <= 14 ? 3 : ageInDays <= 30 ? 1 : 0;
  }

  // Calculate popularity score for each task
  const tasksWithScore = recentTasks.map((task) => ({
    ...task,
    popularityScore: calculatePopularityScore({
      createdAt: task.createdAt,
      urgency: (task.urgency ?? "LOW") as "HIGH" | "MEDIUM" | "LOW",
      _count: task._count,
    }),
  }));

  // Get top 3 tasks sorted by popularity score
  const topTasks = tasksWithScore
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 3);

  let userInfoResult = null;
  let signedProfilePicture = null;
  if (accessToken) {
    const { userInfo } = await getUserInfo(accessToken);
    userInfoResult = userInfo;
    if (userInfo?.profilePicture) {
      signedProfilePicture = await getSignedUrlForFile(
        userInfo.profilePicture,
        true,
      );
    }
  }

  const headers = {
    "Set-Cookie": await commitSession(session),
  };

  // Return JSON response with Set-Cookie header to commit session changes
  return data(
    {
      message: accessToken ? "User logged in" : "User not logged in",
      userInfo: userInfoResult,
      signedProfilePicture,
      error: flashError,
      recentTasks: topTasks,
    },
    { headers },
  );
}

export default function Index() {
  const { userInfo, error, recentTasks, signedProfilePicture } =
    useLoaderData<typeof loader>();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [clientSideError, setClientSideError] = useState<string | null>(null);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setClientSideError(error ?? null);
  }, [error]);

  const openTaskDetailsModal = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  // Typewriter effect for hero text
  const TypewriterText = ({ text, className = "" }) => {
    const [displayText, setDisplayText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayText((prev) => prev + text[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        }, 100);
        return () => clearTimeout(timeout);
      }
    }, [currentIndex, text]);

    return (
      <span className={className}>
        {displayText}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-1 h-8 bg-accentPrimary ml-1"
        />
      </span>
    );
  };

  // Floating elements animation
  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div ref={containerRef} className="bg-basePrimary overflow-hidden">
      <LandingHeader
        userId={userInfo?.id}
        userInfo={userInfo as unknown as users}
        profilePicture={signedProfilePicture || undefined}
      />

      {/* Hero Section with Improved Performance */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Static Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-accentPrimary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-amber-600/20 rounded-full blur-3xl" />
          {/* Static geometric shapes */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 bg-accentPrimary/30 rounded-full"
              style={{
                top: `${20 + i * 15}%`,
                left: `${10 + i * 12}%`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-16 flex flex-col lg:flex-row items-center justify-center relative z-10">
          <div className="lg:w-1/2 text-center lg:text-left">
            {clientSideError && (
              <Notification type="error" message={clientSideError} />
            )}
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 mt-20 md:mt-0"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-baseSecondary">Donate Your Skills,</span>
              <br />
              <TypewriterText
                text="Make a Difference"
                className="text-amber-600"
              />
            </motion.h1>
            <div className="text-lg md:text-xl text-baseSecondary/80 mb-8 max-w-2xl leading-relaxed">
              Connect with charities and create real impact. Join a community of
              Altruvists transforming the non-profit sector.
            </div>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <button
                className="group relative bg-accentPrimary text-baseSecondary px-8 py-4 rounded-2xl text-lg font-semibold shadow-2xl overflow-hidden hover:bg-amber-600 hover:text-txt-secondary transition-colors duration-300"
                onClick={() => navigate("/zitlogin")}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started <ArrowRight size={20} />
                </span>
              </button>
              <button
                className="group border-2 border-baseSecondary text-baseSecondary px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-baseSecondary hover:text-basePrimary transition-all duration-300 backdrop-blur-sm"
                onClick={() => navigate("/explore/tasks")}
              >
                <span className="flex items-center gap-2">
                  Browse Tasks <MagnifyingGlass size={20} />
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start mt-8">
              {[
                {
                  icon: <Users size={24} />,
                  number: "500+",
                  label: "Volunteers",
                },
                {
                  icon: <Heart size={24} />,
                  number: "1000+",
                  label: "Tasks Completed",
                },
                {
                  icon: <Buildings size={24} />,
                  number: "100+",
                  label: "Charities Helped",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center hover:scale-105 transition-transform duration-200"
                >
                  <div className="text-accentPrimary mb-2 flex justify-center">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-baseSecondary">
                    {stat.number}
                  </div>
                  <div className="text-sm text-baseSecondary/70">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 mt-12 lg:mt-0 relative">
            <img
              src="/tent-careworker.png"
              alt="Skills for Good"
              className="w-full h-auto max-w-lg mx-auto drop-shadow-2xl"
              loading="lazy"
            />
            {/* Static floating cards around the image */}
            {[
              {
                icon: <Lightbulb size={20} />,
                text: "Innovation",
                position: "top-5 left-10",
              },
              {
                icon: <Globe size={20} />,
                text: "Global Impact",
                position: "top-30  right-1",
              },
              {
                icon: <Handshake size={20} />,
                text: "Collaboration",
                position: "md:top-40 top-40 left-5",
              },
              {
                icon: <TrendUp size={20} />,
                text: "Growth",
                position: "md:bottom-10 bottom-55 right-30",
              },
            ].map((card, index) => (
              <div
                key={index}
                className={`absolute ${card.position} bg-transparent backdrop-blur-lg border border-baseSecondary/20 z-50 rounded-xl md:p-3 p-1 shadow-xl`}
              >
                <div className="flex items-center gap-2 text-baseSecondary">
                  <span className="text-accentPrimary hidden md:block">
                    {card.icon}
                  </span>
                  <span className="md:text-sm text-xs font-medium">
                    {card.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Removed scroll indicator animation for performance */}
      </section>

      {/* How It Works Section with Enhanced Design */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-basePrimary" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-baseSecondary">
              Your Journey to{" "}
              <span className="text-amber-600">Being an Altruvist</span>
            </h2>
            <div className="w-32 h-1 bg-amber-600 mx-auto mb-6"></div>
            <p className="text-xl text-baseSecondary/80 max-w-3xl mx-auto">
              Three simple steps to start making a difference with your skills
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-amber-600 transform -translate-y-1/2 z-0" />

            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 relative z-10"
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {[
                {
                  title: "Sign Up & Showcase",
                  description:
                    "Create your profile and highlight your unique volunteering skills, experience, and availability.",
                  image: "/volunteer-guide.png",
                  step: "01",
                },
                {
                  title: "Discover & Connect",
                  description:
                    "Browse meaningful projects from verified charities that match your expertise and passion.",
                  image: "/charity-resources.png",
                  step: "02",
                },
                {
                  title: "Create & Impact",
                  description:
                    "Collaborate with nonprofits to build solutions that create lasting positive change.",
                  image: "/Giving_community.png",
                  step: "03",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  className="group relative"
                  whileHover={{ y: -15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Step number */}
                  <motion.div
                    className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-amber-600 text-txt-secondary font-bold text-xl flex items-center justify-center shadow-lg z-20"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.2, type: "spring" }}
                  >
                    {step.step}
                  </motion.div>

                  <div className="bg-basePrimary/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-baseSecondary/20 group-hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                    {/* Background color on hover */}
                    <div className="absolute inset-0 bg-accentPrimary/0 group-hover:bg-accentPrimary/5 transition-all duration-500 rounded-3xl" />

                    {/* Image */}
                    <div className="mb-6 relative z-10">
                      <motion.img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-48 object-cover rounded-2xl shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-4 text-baseSecondary group-hover:text-baseSecondary transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-baseSecondary/80 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blockchain Capabilities Section - Responsive Timeline Layout */}
      <section className="py-24 bg-baseSecondary/5 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:hidden font-bold mb-6 text-baseSecondary ">
              Blockchain{" "}
              <span className="text-amber-600 md:hidden ">Enabled</span>
            </h2>
            <div className="w-32 h-1 bg-amber-600 mx-auto mb-6 md:hidden "></div>
            <p className="text-xl text-baseSecondary/80 max-w-3xl mx-auto leading-relaxed md:hidden ">
              Ensuring transparency, security, and fair compensation through
              decentralized smart contracts
            </p>
          </motion.div>
          <div className="relative max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
            {/* Timeline on the left for large screens */}
            <div className="w-full lg:w-2/5 relative">
              <div className="absolute left-1/2 lg:left-8 transform -translate-x-1/2 lg:translate-x-0 h-full w-1 bg-amber-600/30 z-0" />
              <div className="space-y-16">
                {[
                  {
                    icon: <Lock size={32} className="text-accentPrimary" />,
                    title: "Secure Escrow System",
                    description:
                      "Smart contracts hold payments securely until milestones are completed, protecting volunteers and charities.",
                    bullets: [
                      "Automated milestone verification",
                      "Multi-signature security",
                      "Transparent fund management",
                    ],
                  },
                  {
                    icon: <Coins size={32} className="text-accentPrimary" />,
                    title: "ALT Token Rewards",
                    description:
                      "Earn ALT tokens for your contributions, enabling a sustainable, community-driven marketplace.",
                    bullets: [
                      "Performance-based rewards",
                      "Community governance rights",
                      "Tradeable utility tokens",
                    ],
                  },
                  {
                    icon: (
                      <ChartLine size={32} className="text-accentPrimary" />
                    ),
                    title: "Full Transparency",
                    description:
                      "All transactions and updates are recorded on-chain, ensuring accountability for all stakeholders.",
                    bullets: [
                      "Public transaction history",
                      "Real-time project tracking",
                      "Immutable impact records",
                    ],
                  },
                ].map((feature) => {
                  return (
                    <motion.div
                      key={feature.title}
                      className="relative flex items-start group cursor-pointer"
                      onClick={() => setExpanded((prev) => !prev)}
                    >
                      <div className="absolute left-1/2 lg:left-0 transform -translate-x-1/2 lg:translate-x-0">
                        <div className="w-10 h-10 rounded-full bg-baseSecondary flex items-center justify-center shadow-lg z-10">
                          {feature.icon}
                        </div>
                      </div>
                      <motion.div
                        className={`ml-0 md:ml-16 w-full bg-basePrimary/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-baseSecondary/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl ${expanded ? "ring-4 ring-amber-600" : ""}`}
                      >
                        <h3 className="text-2xl font-bold mb-2 text-baseSecondary flex items-center gap-2">
                          {feature.title}
                          <motion.span
                            initial={false}
                            animate={{ rotate: expanded ? 90 : 0 }}
                            className="ml-2 text-amber-600"
                          >
                            <ArrowRight size={20} />
                          </motion.span>
                        </h3>
                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <p className="text-baseSecondary/80 mb-4">
                                {feature.description}
                              </p>
                              <ul className="space-y-2 text-baseSecondary/70">
                                {feature.bullets.map((bullet, i) => (
                                  <li
                                    key={i}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            {/* Title/Description on the right for large screens */}
            <div className="hidden md:w-full lg:w-3/5 md:flex flex-col justify-center items-center lg:items-start">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-baseSecondary">
                Blockchain <span className="text-amber-600">Enabled</span>
              </h2>
              <div className="w-32 h-1 bg-amber-600 mb-6"></div>
              <p className="text-xl text-baseSecondary/80 max-w-3xl mx-auto leading-relaxed">
                Ensuring transparency, security, and fair compensation through
                decentralized smart contracts
              </p>
              <Link to="/dashboard/blockchain" className="inline-block">
                <button className="group bg-amber-600 text-txt-secondary px-8 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-amber-600/90">
                  <span className="flex items-center gap-2">
                    Explore Blockchain Features
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Opportunities Section with Modern Cards */}
      <section className="py-24 bg-baseSecondary/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-baseSecondary">
              Latest <span className="text-amber-600">Opportunities</span>
            </h2>
            <div className="w-32 h-1 bg-amber-600 mx-auto mb-6"></div>
            <p className="text-xl text-baseSecondary/80 max-w-3xl mx-auto">
              Discover meaningful projects where your skills can create real
              impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="group relative bg-basePrimary/90 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl border border-baseSecondary/10 hover:shadow-2xl transition-all duration-500"
              >
                {/* Urgency indicator */}
                <div
                  className={`h-2 ${
                    task.urgency === "HIGH"
                      ? "bg-red-500"
                      : task.urgency === "MEDIUM"
                        ? "bg-orange-500"
                        : "bg-green-500"
                  }`}
                />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        task.urgency === "HIGH"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : task.urgency === "MEDIUM"
                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                      }`}
                    >
                      <Shield size={14} className="mr-1" />
                      {task.urgency}
                    </span>
                    <div className="flex items-center text-sm text-baseSecondary/70">
                      <Users size={16} className="mr-1" />
                      {task._count.taskApplications}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-3 text-baseSecondary group-hover:text-amber-600 transition-colors line-clamp-2">
                    {task.title}
                  </h3>

                  {/* Charity */}
                  <div className="flex items-center mb-4 text-baseSecondary/80">
                    <Buildings size={16} className="mr-2 text-accentPrimary" />
                    <span className="text-sm font-medium">
                      {task.charity.name}
                    </span>
                  </div>

                  {/* Action button */}
                  <button
                    className="w-full py-3 px-4 bg-accentPrimary/80 text-txt-secondary rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group hover:bg-amber-600/90"
                    onClick={() => openTaskDetailsModal(task)}
                  >
                    <span className="text-baseSecondary">View Details</span>
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform text-baseSecondary"
                    />
                  </button>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-accentPrimary/0 group-hover:bg-accentPrimary/5 transition-all duration-500 pointer-events-none" />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/explore/tasks" className="inline-block">
              <button className="group bg-baseSecondary text-basePrimary px-8 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-baseSecondary/90">
                <span className="flex items-center gap-2">
                  Explore All Opportunities
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section with Enhanced Design */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-baseSecondary" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-8 text-basePrimary">
                Ready to Make an Impact?
                <br />
                <span className="text-accentPrimary">
                  Join the Altruvist Community
                </span>
              </h2>

              <p className="text-xl md:text-2xl mb-12 text-basePrimary/90 max-w-3xl mx-auto leading-relaxed">
                Join thousands of volunteers making a real difference. Your
                expertise could be the key to solving critical challenges.
              </p>

              <motion.div
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <motion.button
                  className="group bg-basePrimary text-baseSecondary px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 hover:bg-accentPrimary"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/explore/tasks")}
                >
                  Start Making Impact
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </motion.button>

                <motion.div
                  className="flex items-center gap-4 text-basePrimary/90"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-basePrimary/20 border-2 border-basePrimary flex items-center justify-center"
                      >
                        <User size={16} className="text-red-400" />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    Join 500+ volunteers
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Floating CTA image */}
            <motion.div
              className="mt-16"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
              variants={floatingVariants}
              animate="animate"
            >
              <img
                src="/AfricaHands.png"
                alt="Making a global impact"
                className="w-full max-w-md mx-auto drop-shadow-2xl rounded-3xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Enhanced Modal */}
      <AnimatePresence>
        {modalOpen && (
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
            {selectedTask && (
              <div className="bg-basePrimary rounded-3xl shadow-2xl max-w-4xl w-full border border-baseSecondary/20">
                <TaskDetailsCard
                  id={selectedTask.id}
                  title={selectedTask.title}
                  description={selectedTask.description || ""}
                  impact={selectedTask.impact || ""}
                  charityName={selectedTask.charity.name}
                  charityId={selectedTask.charityId}
                  category={selectedTask.category || []}
                  requiredSkills={selectedTask.requiredSkills || []}
                  urgency={selectedTask.urgency}
                  volunteersNeeded={selectedTask.volunteersNeeded || 1}
                  deliverables={selectedTask.deliverables || []}
                  deadline={new Date(selectedTask.deadline)}
                  userId={userInfo?.id || ""}
                  status={selectedTask.status || "NOT_STARTED"}
                  resources={selectedTask.resources || []}
                  userRole={userInfo?.roles || []}
                  taskApplications={selectedTask.taskApplications || []}
                />
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
