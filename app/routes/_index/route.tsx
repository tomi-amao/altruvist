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
  Buildings
} from "phosphor-react";
import { getUserInfo } from "~/models/user2.server";
import { getSession, commitSession } from "~/services/session.server";
import { prisma } from "~/services/db.server";
import Notification from "~/components/cards/NotificationCard";
import { subDays } from "date-fns/subDays";
import LandingHeader from "~/components/navigation/LandingHeader";
import LineGraph from "~/components/graphs/IndexGraph";

export const meta: MetaFunction = () => {
  return [
    { title: "Altruvist" },
    {
      name: "description",
      content: "Donate your digital skills to make a difference. Join Altruvist today!"
    },
  ];
};

export default function Index() {
  const { userInfo, error, recentTasks } = useLoaderData<typeof loader>();

  if (error) {
    return <Notification type="error" message={error} />;
  }

  const sampleData = [
    { x: new Date('2023-01-01'), y: 50 },
    { x: new Date('2023-02-01'), y: 60 },
    { x: new Date('2023-03-01'), y: 45 },
    { x: new Date('2023-04-01'), y: 70 },
    { x: new Date('2023-05-01'), y: 65 },
    { x: new Date('2023-06-01'), y: 85 },
    { x: new Date('2023-07-01'), y: 90 },
  ];

  return (
    <div className="bg-gradient-to-b from-baseSecondary ">
      {/* <Navbar altBackground={true} userId={userInfo?.id} /> */}
      <LandingHeader userId={userInfo?.id} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
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
            <p className="text-xl text-basePrimary mb-8 max-w-lg">
              Connect with charities and make a real impact with your technical expertise, helping organizations scale their missions.
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
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img src="/pulling-medicare.png" alt="Making an impact" className="w-full h-auto max-w-md mx-auto" />
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
            </motion.div>
            {/* Background decorative elements */}

          </motion.div>
        </div>

      </section>

      {/* How It Works Section */}
      <section className="bg-basetext-baseSecondary min-h-screen flex items-center">
        <div className="container mx-auto px-6 py-16">
          <div className="pb-10">
            <img src="/hugging-old.png" alt="Making an impact" className="w-full h-auto max-w-md mx-auto" />
          </div>
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4  text-accentPrimary/80">How It Works</h2>
            <div className="w-24 h-1 bg-accentPrimary mx-auto mb-6"></div>
            <p className="text-lg text-basePrimary max-w-xl mx-auto">
              Join our platform in three simple steps and start making an impact through your technical skills.
            </p>
          </motion.div>


          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto text-basePrimary">
            {[
              {
                title: "Register",
                icon: <Target size={32} weight="fill" />,
                description: "Create your account and list your unique technical skills and availability."
              },
              {
                title: "Find Projects",
                icon: <MagnifyingGlass size={32} weight="fill" />,
                description: "Browse charitable projects that match your expertise and interests."
              },
              {
                title: "Make Impact",
                icon: <Sparkle size={32} weight="fill" />,
                description: "Contribute your skills and help charities achieve their digital goals."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="bg-baseSecondary/30 rounded-xl p-8 text-center shadow-lg border border-gray-100 relative"
                whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <div className="w-16 h-16 rounded-full bg-accentPrimary/10 text-accentPrimary flex items-center justify-center mb-6 mx-auto">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-accentPrimary/90">{step.title}</h3>
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
      <section className="py-16 bg-gradient-to-br from-basetext-baseSecondary to-basePrimary text-baseSecondary min-h-screen flex items-center">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4 text-accentPrimary/80">Our Impact</h2>
            <div className="w-24 h-1 bg-accentSecondary mx-auto mb-6"></div>
            <p className="text-lg max-w-xl mx-auto text-basePrimary">
              Together we're creating lasting change for charities worldwide.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              { value: "500+", label: "Completed Tasks", icon: <Trophy size={48} weight="fill" /> },
              { value: "200+", label: "Active Volunteers", icon: <Users size={48} weight="fill" /> },
              { value: "50+", label: "Charities Helped", icon: <Star size={48} weight="fill" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-baseSecondary/80 backdrop-blur-sm rounded-xl p-8 text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ transform: "translateY(-10px)" }}
              >
                <div className="text-accentPrimary mb-4 flex justify-center">{stat.icon}</div>
                <div className="text-5xl font-bold mb-2 text-accentPrimary">{stat.value}</div>
                <div className="text-xl opacity-90 text-basePrimary">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Chart section - Modified to be fully responsive */}
          <motion.div 
            className="mt-16 w-full max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-6 bg-baseSecondary/80 backdrop-blur-sm rounded-xl">
              <h3 className="text-2xl font-bold mb-6 text-accentPrimary text-center">Impact Growth</h3>
              <div className="w-full">
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
      </section>

      {/* Recent Tasks Section */}
      <section className="bg-basetext-baseSecondary min-h-screen flex items-center">
        <div className="container mx-auto px-6 py-16">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4 text-baseSecondary">Latest Opportunities</h2>
            <div className="w-24 h-1 bg-accentPrimary mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Browse some of the most recent projects that need your expertise.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {recentTasks.map((task, index) => (
              <motion.div
                key={task.id}
                className=" rounded-xl overflow-hidden border border-gray-200 shadow-md transform-gpu"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                whileHover={{
                  y: -8,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div className={`h-2 ${task.urgency === 'HIGH' ? 'bg-dangerPrimary' :
                    task.urgency === 'MEDIUM' ? 'bg-accentPrimary' :
                      'bg-confirmPrimary'
                  }`}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.urgency === 'HIGH' ? 'bg-dangerPrimary/10 text-dangerPrimary' :
                        task.urgency === 'MEDIUM' ? 'bg-accentPrimary/10 text-accentPrimary' :
                          'bg-confirmPrimary/10 text-confirmPrimary'
                      }`}>
                      {task.urgency} URGENCY
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock size={16} className="mr-1" />
                      {task._count.taskApplications} applicants
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-baseSecondary">{task.title}</h3>
                  <p className="text-gray-600 mb-4 flex items-center">
                    <Buildings size={16} className="mr-2" />
                    {task.charity.name}
                  </p>
                  <motion.button
                    className="w-full py-2 px-4 bg-accentPrimary text-baseSecondary rounded-md hover:bg-accentPrimaryDark transition-colors flex items-center justify-center space-x-2 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>View Details</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
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
            <Link to="/tasks" className="inline-block">
              <motion.button
                className="border-2 border-accentPrimary text-accentPrimary hover:bg-accentPrimary hover:text-baseSecondary transition-colors px-6 py-3 rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                View All Opportunities
              </motion.button>
            </Link>
          </motion.div>
          <div  className="pt-8">

          <img src="/tent-careworker.png" alt="Making an impact" className="w-full h-auto max-w-md mx-auto" />
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
                className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Join our community today and help charities achieve their missions through your unique digital expertise.
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

                <img src="/flooded-house.png" alt="Making an impact" className="w-full h-auto max-w-md mx-auto" />
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
              <p className="text-gray-300 mb-6">Making digital skills count for charity</p>
              <div className="flex space-x-4">
                {/* Social media icons here */}
                {/* ...existing code... */}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {/* ...existing code... */}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Resources</h4>
              <ul className="space-y-3">
                {/* ...existing code... */}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Subscribe</h4>
              <p className="text-gray-300 mb-4">Stay updated with our latest opportunities</p>
              <form className="flex flex-col space-y-2">
                <input
                  type="email"
                  placeholder="Email address"
                  className="px-4 py-2 bg-basePrimary/40 rounded-lg text-baseSecondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accentSecondary"
                />
                <motion.button
                  className="bg-accentSecondary text-baseSecondary px-4 py-2 rounded-lg hover:bg-accentSecondary/80"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Subscribe
                </motion.button>
              </form>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Altruvist. All rights reserved.</p>
          </div>
        </div>
      </footer>
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
