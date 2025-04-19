import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { motion } from "framer-motion";
import {
  Target,
  MagnifyingGlass,
  Sparkle,
  Trophy,
  Users,
  Star,
  Clock,
  Buildings,
} from "@phosphor-icons/react";
import { getUserInfo } from "~/models/user2.server";
import { getSession, commitSession } from "~/services/session.server";
import { prisma } from "~/services/db.server";
import Notification from "~/components/cards/NotificationCard";
import { subDays } from "date-fns/subDays";
import LandingHeader from "~/components/navigation/LandingHeader";
import LineGraph from "~/components/graphs/IndexGraph";
import { useEffect, useRef, useState } from "react";
import CompanyLogoBanner from "./LogoBanner";
import { Modal } from "~/components/utils/Modal2";
import TaskDetailsCard from "~/components/tasks/taskDetailsCard";
import { users } from "@prisma/client";
import type { Task } from "~/types/tasks";

export const meta: MetaFunction = () => {
  return [
    { title: "Altruvist" },
    {
      name: "description",
      content:
        "Donate your digital skills to make a difference. Join Altruvist today!",
    },
  ];
};

export default function Index() {
  const { userInfo, error, recentTasks } = useLoaderData<typeof loader>();
  const [showGraph, setShowGraph] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [signedProfilePicture, setSignedProfilePicture] = useState<
    string | null
  >(null);
  const [clientSideError, setClientSideError] = useState<string | null>(null);

  useEffect(() => {
    // Set the error from the server in client-side state
    if (error) {
      setClientSideError(error);
    }
  }, [error]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Delay the graph appearance
            setTimeout(() => setShowGraph(true), 1000);
          }
        });
      },
      { threshold: 0.5 },
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const sampleData = [
    { x: new Date("2023-01-01"), y: 50 },
    { x: new Date("2023-02-01"), y: 60 },
    { x: new Date("2023-03-01"), y: 45 },
    { x: new Date("2023-04-01"), y: 70 },
    { x: new Date("2023-05-01"), y: 65 },
    { x: new Date("2023-06-01"), y: 85 },
    { x: new Date("2023-07-01"), y: 90 },
  ];

  const stats = [
    {
      value: "500+",
      label: "Completed Tasks",
      icon: <Trophy size={48} weight="fill" />,
      position: "left",
      image: "/health-package.png", // Replace with actual illustration paths
    },
    {
      value: "200+",
      label: "Active Volunteers",
      icon: <Users size={48} weight="fill" />,
      position: "right",
      image: "/family-house.png",
    },
    {
      value: "50+",
      label: "Charities Helped",
      icon: <Star size={48} weight="fill" />,
      position: "left",
      image: "/family-hands.png",
    },
  ];

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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden flex-col pt-60">
        <div className="container mx-auto px-6 py-16 flex flex-col lg:flex-row items-center justify-center h-full">
          <motion.div
            className="lg:w-1/2 z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold text-accentPrimary  mb-6">
              Donate Your Skills, Make a Difference
            </h1>
            {clientSideError && (
              <Notification type="error" message={clientSideError} />
            )}
            <p className="text-xl text-basePrimary mb-8 max-w-lg">
              Connect with charities and make a real impact with your technical
              expertise, helping organizations scale their missions.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.button
                className="bg-accentPrimary hover:bg-accentPrimaryDark text-baseSecondary px-8 py-4 rounded-lg text-lg font-medium shadow-lg transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
              </motion.button>
              <motion.button
                className="border-2 border-accentPrimary text-accentPrimary px-8 py-4 rounded-lg text-lg font-medium hover:bg-accentPrimary hover:text-baseSecondary transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Browse Projects
              </motion.button>
            </div>
          </motion.div>
          <motion.div
            className="lg:w-1/2 mt-12 lg:mt-0 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img
              src="/pulling-medicare.png"
              alt="Making an impact"
              className="w-full h-auto max-w-md mx-auto"
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
        <div className="top-28 relative">
          <CompanyLogoBanner />
        </div>
      </section>

      {/* How It Works Section */}

      <section className="bg-basetext-baseSecondary min-h-screen flex items-center">
        <div className="container mx-auto px-6 py-16">
          <div className="pb-10">
            <img
              src="/hugging-old.png"
              alt="Making an impact"
              className="w-full h-auto max-w-md mx-auto"
            />
          </div>
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4  text-accentPrimary/80">
              How It Works
            </h2>
            <div className="w-24 h-1 bg-accentPrimary mx-auto mb-6"></div>
            <p className="text-lg text-basePrimary max-w-xl mx-auto">
              Join our platform in three simple steps and start making an impact
              through your technical skills.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto text-basePrimary">
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
                <h3 className="text-2xl font-bold mb-4 text-accentPrimary/90">
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

      {/* Stats Section */}
      <section className="py-16 bg-baseSecondary/50 min-h-screen flex items-center">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4 text-accentPrimary">
              Our Impact
            </h2>
            <div className="w-24 h-1 bg-accentPrimary mx-auto mb-6"></div>
            <p className="text-lg max-w-xl mx-auto text-accentPrimary">
              Together we&apos;re creating lasting change for charities
              worldwide.
            </p>
          </motion.div>

          <div
            ref={statsRef}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto shrink"
          >
            {/* Stats Cards */}
            <div className="space-y-8 max-w-md mx-auto w-full">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-baseSecondary/90 rounded-xl p-8 shadow-lg border border-accentPrimary  "
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                >
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0 text-accentPrimary">
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-2xl md:text-4xl font-bold text-accentPrimary mb-1">
                        {stat.value}
                      </div>
                      <div className="text-lg text-basePrimary">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Graph/Image Container */}
            <div className="relative h-full">
              <motion.div
                className=" inset-0"
                initial={{ opacity: 1 }}
                animate={{ opacity: showGraph ? 0 : 1 }}
                transition={{ duration: 0.8 }}
              >
                <img
                  src="/family-child.png"
                  alt="Impact Visualization"
                  className="w-full h-full object-cover rounded-xl"
                />
              </motion.div>

              <motion.div
                className="md:absolute relative -top-32 md:top-0 inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: showGraph ? 1 : 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="border border-accentPrimary rounded-xl p-2 shadow-lg pt-8 backdrop-blur-xl w-full h-fit bg-baseSecondary/80">
                  <h3 className="text-2xl font-bold mb-4 text-accentPrimary text-center">
                    Impact Growth
                  </h3>
                  <div className="w-full h-[calc(100%-4rem)] relative">
                    <LineGraph
                      data={sampleData}
                      xAxisLabel="Month"
                      yAxisLabel="Score"
                      lineColor="#F5F5DC"
                      axisColor="#F5F5DC"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* <SuccessStoriesSection/> */}
      {/* Recent Tasks Section */}
      <section className="text-baseSecondary min-h-screen flex items-center">
        <div className="container mx-auto px-6 py-16">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4 text-baseSecondary">
              Latest Opportunities
            </h2>
            <div className="w-24 h-1 bg-accentPrimary mx-auto mb-6"></div>
            <p className="text-lg  max-w-xl mx-auto">
              Browse some of the most recent projects that need your expertise.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {recentTasks.map((task, index) => (
              <motion.div
                key={task.id}
                className=" rounded-xl overflow-hidden border border-basePrimary shadow-md "
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
                      ? "bg-dangerPrimary"
                      : task.urgency === "MEDIUM"
                        ? "bg-accentPrimary"
                        : "bg-confirmPrimary"
                  }`}
                ></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.urgency === "HIGH"
                          ? "bg-dangerPrimary/10 text-dangerPrimary"
                          : task.urgency === "MEDIUM"
                            ? "bg-accentPrimary/10 text-accentPrimary"
                            : "bg-confirmPrimary/10 text-confirmPrimary"
                      }`}
                    >
                      {task.urgency} URGENCY
                    </span>
                    <span className="text-sm  flex items-center">
                      <Clock size={16} className="mr-1" />
                      {task._count.taskApplications} applicants
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-baseSecondary">
                    {task.title}
                  </h3>
                  <p className=" mb-4 flex items-center">
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
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/explore" className="inline-block">
              <motion.button
                className="border-2 border-accentPrimary text-accentPrimary hover:bg-accentPrimary hover:text-baseSecondary transition-colors px-6 py-3 rounded-lg font-medium"
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
              className="w-full h-auto max-w-md mx-auto"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex items-center bg-baseSecondary">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto  bg-accentPrimary  rounded-2xl p-1">
            <div className="bg-basetext-baseSecondary rounded-xl p-10 lg:p-16 text-center">
              <motion.h2
                className="text-3xl lg:text-4xl font-bold mb-6 text-baseSecondary"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Ready to share your skills for good?
              </motion.h2>
              <motion.p
                className="text-lg  mb-8 max-w-2xl mx-auto"
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
                  className="bg-accentPrimary text-baseSecondary px-8 py-4 rounded-lg text-lg font-medium shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Make an Impact
                </motion.button>
              </motion.div>
              <div className="pt-8">
                <img
                  src="/flooded-house.png"
                  alt="Making an impact"
                  className="w-full h-auto max-w-md mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-basetext-baseSecondary text-baseSecondary pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Altruvist</h3>
              <p className="mb-6">Making digital skills count for charity</p>
              <div className="flex space-x-4">
                {/* Social media icons */}
                <a href="https://twitter.com/altruvist" className="hover:text-accentPrimary transition-colors" aria-label="Twitter">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="https://linkedin.com/company/altruvist" className="hover:text-accentPrimary transition-colors" aria-label="LinkedIn">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="https://github.com/altruvist-org" className="hover:text-accentPrimary transition-colors" aria-label="GitHub">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="https://instagram.com/altruvist_org" className="hover:text-accentPrimary transition-colors" aria-label="Instagram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link to="/explore" className="hover:text-accentPrimary transition-colors">Explore Tasks</Link></li>
                <li><Link to="/about" className="hover:text-accentPrimary transition-colors">About Us</Link></li>
                <li><Link to="/_dashboard/dashboard" className="hover:text-accentPrimary transition-colors">Dashboard</Link></li>
                <li><Link to="/search" className="hover:text-accentPrimary transition-colors">Search</Link></li>
                <li><Link to="/profile" className="hover:text-accentPrimary transition-colors">Your Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-accentPrimary transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-accentPrimary transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-accentPrimary transition-colors">Volunteer Guide</a></li>
                <li><a href="#" className="hover:text-accentPrimary transition-colors">Charity Resources</a></li>
                <li><a href="#" className="hover:text-accentPrimary transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Subscribe</h4>
              <p className="mb-4">
                Stay updated with our latest opportunities
              </p>
              <form className="flex flex-col space-y-2">
                <input
                  type="email"
                  placeholder="Email address"
                  className="px-4 py-2 bg-basePrimary/40 rounded-lg text-baseSecondary placeholder:text-basePrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary"
                />
                <motion.button
                  className="bg-accentPrimary text-baseSecondary px-4 py-2 rounded-lg hover:bg-accentPrimary/80"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Subscribe
                </motion.button>
              </form>
            </div>
          </div>
          <div className="border-t border-basePrimary pt-8 text-center text-basePrimary text-sm">
            <p>© {new Date().getFullYear()} Altruvist. All rights reserved.</p>
            <div className="flex justify-center mt-4 space-x-6">
              <a href="#" className="hover:text-accentPrimary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-accentPrimary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-accentPrimary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

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

  // Calculate popularity score for each task
  const tasksWithScore = recentTasks.map((task) => ({
    ...task,
    popularityScore: calculatePopularityScore(task),
  }));

  // Get top 3 tasks sorted by popularity score
  const topTasks = tasksWithScore
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 3);

  // Only commit session if there was a flash message
  const headers = flashError
    ? {
        "Set-Cookie": await commitSession(session),
      }
    : undefined;

  let userInfoResult = null;
  if (accessToken) {
    const { userInfo } = await getUserInfo(accessToken);
    userInfoResult = userInfo;
  }

  return json(
    {
      message: accessToken ? "User logged in" : "User not logged in",
      userInfo: userInfoResult,
      error: flashError,
      recentTasks: topTasks,
    },
    {
      headers,
    },
  );
}

// Helper function to calculate task popularity score
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
