import {
  Link,
  useLoaderData,
  useNavigate,
  LoaderFunctionArgs,
  MetaFunction,
  data,
} from "react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
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
  Clock,
  MagnifyingGlass,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import { users } from "@prisma/client";

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
    urgency: string;
    _count: { taskApplications: number };
  }) {
    const recencyScore = calculateRecencyScore(task.createdAt);
    const applicationScore = task._count.taskApplications * 2;
    const urgencyScores = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    return recencyScore + applicationScore + (urgencyScores[task.urgency] || 1);
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
    popularityScore: calculatePopularityScore(task),
  }));

  // Get top 3 tasks sorted by popularity score
  const topTasks = tasksWithScore
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 3);

  let userInfoResult = null;
  if (accessToken) {
    const { userInfo } = await getUserInfo(accessToken);
    userInfoResult = userInfo;
  }

  const headers = {
    "Set-Cookie": await commitSession(session),
  };

  // Return JSON response with Set-Cookie header to commit session changes
  return data(
    {
      message: accessToken ? "User logged in" : "User not logged in",
      userInfo: userInfoResult,
      error: flashError,
      recentTasks: topTasks,
    },
    { headers },
  );
}

export default function Index() {
  const { userInfo, error, recentTasks } = useLoaderData<typeof loader>();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [signedProfilePicture, setSignedProfilePicture] = useState<
    string | null
  >(null);
  const [clientSideError, setClientSideError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Sync client-side error state with loader error (clears on undefined)
    setClientSideError(error ?? null);
  }, [error]);

  const openTaskDetailsModal = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  useEffect(() => {
    async function fetchSignedUrl() {
      const res = await fetch(
        `/api/s3-get-url?file=${userInfo?.profilePicture}&action=upload`,
      );
      const data = await res.json();
      if (data.url) {
        setSignedProfilePicture(data.url);
      }
    }
    fetchSignedUrl();
  }, [userInfo?.profilePicture]);
  return (
    <div className="bg-gradient-to-b from-baseSecondary ">
      <LandingHeader
        userId={userInfo?.id}
        userInfo={userInfo as unknown as users}
        profilePicture={signedProfilePicture || undefined}
      />
      <section className="relative flex items-center overflow-hidden flex-col py-8 min-h-[100vh] md:py-24 lg:min-h-screen  ">
        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-16 flex flex-col lg:flex-row items-center justify-center my-auto h-full">
          <motion.div
            className="lg:w-1/2 z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold !text-accentPrimary mb-6 mt-20 md:mt-0">
              Donate Your Skills, Make a Difference
            </h1>
            {clientSideError && (
              <Notification type="error" message={clientSideError} />
            )}
            <p className="text-base md:text-xl text-basePrimary mb-8 max-w-lg">
              Connect with charities and make a real impact with your time,
              helping non-profit organizations meet their missions.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.button
                className="bg-accentPrimary hover:bg-accentPrimaryDark text-baseSecondary px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium shadow-lg transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  navigate("/zitlogin");
                }}
              >
                Get Started
              </motion.button>
              <motion.button
                className="border-2 border-accentPrimary z-50 text-accentPrimary px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium hover:bg-accentPrimary hover:text-baseSecondary transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  navigate("/explore/tasks");
                }}
              >
                Browse Projects
              </motion.button>
            </div>
          </motion.div>
          <motion.div
            className="lg:w-1/2 mt-12 lg:mt-0 relative z-0"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img
              src="/pulling-medicare.png"
              alt="Making an impact"
              className="w-full h-auto max-w-xs sm:max-w-sm md:max-w-md mx-auto"
            />
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            ></motion.div>
            {/* Background decorative elements */}
            <motion.div
              className="absolute z-10 w-72 h-72 bg-accentPrimary/40 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4], // Ensure it never goes below 0.4
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                top: "10%",
                right: "15%",
              }}
            />
            <motion.div
              className="absolute z-10 w-72 h-72 bg-accentPrimary/40 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.7, 0.4], // Ensure it never goes below 0.4
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                bottom: "10%",
                left: "5%",
              }}
            />
          </motion.div>
        </div>
      </section>
      {/* <section>
        <SuccessStoriesSection />

      </section> */}
      <section className="text-baseSecondary py-8 min-h-[100vh] md:py-24 flex flex-col justify-center">
        <div className="container mx-auto px-4 sm:px-6 h-full flex flex-col justify-center">
          <div className="pb-6 md:pb-10">
            <img
              src="/hugging-old.png"
              alt="Making an impact"
              className="w-full h-auto max-w-xs sm:max-w-sm md:max-w-md mx-auto"
            />
          </div>
          <motion.div
            className="text-center mb-10 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 !text-accentPrimary">
              How It Works
            </h2>
            <div className="w-16 md:w-24 h-1 bg-accentPrimary mx-auto mb-4 md:mb-6"></div>
            <p className="text-base md:text-lg text-basePrimary max-w-xl mx-auto">
              Join our platform in three simple steps and start making an impact
              through your technical skills.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 max-w-5xl mx-auto !text-basePrimary">
            {[
              {
                title: "Register",
                icon: <Target size={32} weight="fill" />,
                description:
                  "Create your account and list your unique technical skills and availability.",
              },
              {
                title: "Find Projects",
                icon: <MagnifyingGlass size={32} weight="fill" />,
                description:
                  "Browse charitable projects that match your expertise and interests.",
              },
              {
                title: "Make Impact",
                icon: <Sparkle size={32} weight="fill" />,
                description:
                  "Contribute your skills and help charities achieve their digital goals.",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                className="bg-baseSecondary/50 rounded-xl p-8 text-center shadow-lg border  relative"
                whileHover={{
                  y: -8,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <div className="w-16 h-16 rounded-full bg-accentPrimary/10 text-accentPrimary flex items-center justify-center mb-6 mx-auto">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 !text-accentPrimary/90">
                  {step.title}
                </h3>
                <p className="text-basePrimary">{step.description}</p>

                {/* Step number indicator */}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-accentPrimary text-baseSecondary flex items-center justify-center font-bold">
                  {index + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Tasks Section */}
      <section className="text-baseSecondary py-8 min-h-[100vh] md:py-24 flex flex-col justify-center">
        <div className="container mx-auto px-4 sm:px-6 h-full flex flex-col justify-center">
          <motion.div
            className="text-center mb-10 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 !text-accentPrimary">
              Latest Opportunities
            </h2>
            <div className="w-16 md:w-24 h-1 bg-accentPrimary mx-auto mb-4 md:mb-6"></div>
            <p className="text-base md:text-lg max-w-xl mx-auto !text-basePrimary">
              Browse some of the most recent projects that need your expertise.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {recentTasks.map((task, index) => (
              <motion.div
                key={task.id}
                className="bg-basePrimary rounded-xl overflow-hidden border border-basePrimary shadow-md"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                whileHover={{
                  y: -8,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div
                  className={`h-2 ${
                    task.urgency === "HIGH"
                      ? "bg-dangerPrimary/20"
                      : task.urgency === "MEDIUM"
                        ? "bg-indicator-orange/20"
                        : "bg-baseSecondary/10"
                  }`}
                ></div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${
                        task.urgency === "HIGH"
                          ? "bg-dangerPrimary/20 text-dangerPrimary"
                          : task.urgency === "MEDIUM"
                            ? "bg-indicator-orange/20 text-indicator-orange"
                            : "bg-baseSecondary/10 text-baseSecondary"
                      }`}
                    >
                      {task.urgency} URGENCY
                    </span>
                    <span className="text-xs sm:text-sm flex items-center">
                      <Clock size={16} className="mr-1" />
                      {task._count.taskApplications} applicants
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-baseSecondary">
                    {task.title}
                  </h3>
                  <p className="text-sm sm:text-base mb-4 flex items-center">
                    <Buildings size={16} className="mr-2" />
                    {task.charity.name}
                  </p>
                  <motion.button
                    className="w-full py-2 px-4 bg-accentPrimary text-baseSecondary rounded-md hover:bg-accentPrimaryDark transition-colors flex items-center justify-center space-x-2 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openTaskDetailsModal(task)}
                  >
                    <span>View Details</span>
                    <svg
                      className="w-4 h-4"
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
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-8 sm:mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/explore/tasks" className="inline-block">
              <motion.button
                className="border-2 border-accentPrimary text-accentPrimary hover:bg-accentPrimary hover:text-baseSecondary transition-colors px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                View All Opportunities
              </motion.button>
            </Link>
          </motion.div>
          <div className="pt-8">
            <img
              src="/tent-careworker.png"
              alt="Making an impact"
              className="w-full h-auto max-w-xs sm:max-w-sm md:max-w-md mx-auto"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 min-h-[100vh] md:py-24 bg-baseSecondary flex flex-col justify-center">
        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-16 h-full flex flex-col justify-center">
          <div className="max-w-4xl mx-auto bg-accentPrimary rounded-2xl p-1">
            <div className="bg-basetext-baseSecondary rounded-xl p-6 md:p-10 lg:p-16 text-center">
              <motion.h2
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-baseSecondary"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Ready to share your skills for good?
              </motion.h2>
              <motion.p
                className="text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Join our community today and help charities achieve their
                missions through your unique digital expertise.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  className="bg-accentPrimary text-baseSecondary px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    navigate("/explore/tasks");
                  }}
                >
                  Make an Impact
                </motion.button>
              </motion.div>
              <div className="pt-6 md:pt-8">
                <img
                  src="/flooded-house.png"
                  alt="Making an impact"
                  className="w-full h-auto max-w-xs sm:max-w-sm md:max-w-md mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Task Details Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {selectedTask && (
          <div className="bg-basePrimary rounded-xl shadow-2xl max-w-4xl w-full">
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
    </div>
  );
}
