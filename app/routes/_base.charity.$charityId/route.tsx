import {  LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import { useState, useMemo } from "react";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import { getCharity } from "~/models/charities.server";
import { getFeatureFlags } from "~/services/env.server";
import { getSignedUrlForFile } from "~/services/s3.server";
import { getUserTasks } from "~/models/tasks.server";
import JoinCharityModal from "~/components/cards/JoinCharityModal";
import { ErrorCard } from "~/components/utils/ErrorCard";
import { PrimaryButton, SecondaryButton } from "~/components/utils/BasicButton";
import TaskDetailsCard from "~/components/tasks/taskDetailsCard";
import { Modal } from "~/components/utils/Modal2";
import { CombinedCollections } from "~/types/tasks";
import CharityTasksSection from "~/components/tasks/CharityTasksSection";
import {
  Globe,
  Envelope,
  User,
  Calendar,
  Plus,
  Clock,
  ClipboardText,
  UsersThree,
  PuzzlePiece,
  CalendarCheck,
  Target,
} from "@phosphor-icons/react";
import { formatDistanceToNow, format } from "date-fns";

export const meta: MetaFunction = ({ data }) => {
  if (!data?.charity) {
    return [
      { title: "Charity Not Found | Altruvist" },
      {
        name: "description",
        content: "The requested charity could not be found.",
      },
      { name: "viewport", content: "width=device-width,initial-scale=1" },
      { charSet: "utf-8" },
    ];
  }
  return [
    { title: `${data.charity.name} | Altruvist` },
    {
      name: "description",
      content:
        data.charity.description ||
        `Learn more about ${data.charity.name} and get involved.`,
    },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { charityId } = params;

  if (!charityId) {
    return { error: "Charity ID is required", charity: null }
  }

  // Get charity details
  const { charity, status } = await getCharity(charityId, {
    tasks: true,
    charityMemberships: true,
  });
  const charityTasks = charity?.tasks || [];
  if (status !== 200 || !charity) {
    return { error: "Charity not found", charity: null, status: 404 };
  }

  // Get signed URL for background picture if it exists
  let signedBackgroundPicture = null;
  if (charity.backgroundPicture) {
    try {
      signedBackgroundPicture = await getSignedUrlForFile(
        charity.backgroundPicture,
        true,
      );
    } catch (error) {
      console.error("Error getting signed URL:", error);
    }
  }

  // Get total number of volunteers and active tasks
  const activeTasks =
    charityTasks?.filter(
      (task) => task.status !== "COMPLETED" && task.status !== "CANCELLED",
    ) || [];

  const completedTasks =
    charityTasks?.filter((task) => task.status === "COMPLETED") || [];

  // Get unique volunteers from task applications

  // Check if user is logged in and get their info
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const { userInfo, charityMemberships: userMemberships } =
    await getUserInfo(accessToken);

  // Get feature flags
  const { FEATURE_FLAG } = getFeatureFlags();

  // Check if the user is a member of this charity
  const isMember =
    userMemberships?.memberships?.some(
      (membership) => membership.charityId === charityId,
    ) || false;

  // Find user's membership details if they are a member
  const userMembership = isMember
    ? userMemberships?.memberships?.find((m) => m.charityId === charityId)
    : null;

  const charityVolunteers =
    charity.charityMemberships?.filter((membership) =>
      membership.roles.includes("volunteer"),
    ) || [];

  // Get user's task applications if they are a volunteer
  let taskApplications = null;
  if (userInfo?.roles?.includes("volunteer")) {
    const { tasks: userTasks } = await getUserTasks(
      "volunteer",
      undefined,
      userInfo.id,
    );
    taskApplications = userTasks?.map((task) => task.id) || [];
  }

  return {
    charity,
    charityTasks,
    userInfo,
    isMember,
    userMembership,
    FEATURE_FLAG,
    taskApplications,
    stats: {
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      volunteers: charityVolunteers,
    },
    signedBackgroundPicture,
  };
}

export default function CharityDetailPage() {
  const {
    charity,
    charityTasks,
    userInfo,
    isMember,
    userMembership,
    stats,
    taskApplications,
    signedBackgroundPicture,
  } = useLoaderData<typeof loader>();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CombinedCollections | null>(
    null,
  );
  const [localMembership] = useState<boolean>(isMember);
  const [userRoles] = useState<string[]>(userMembership?.roles || []);

  // Extract unique required skills from active tasks - moved before conditional return
  const activeTasks = useMemo(
    () =>
      charityTasks?.filter(
        (task) => task.status !== "COMPLETED" && task.status !== "CANCELLED",
      ) || [],
    [charityTasks],
  );

  const requiredSkills = useMemo(() => {
    const skillsSet = new Set<string>();

    activeTasks.forEach((task) => {
      if (task.requiredSkills && Array.isArray(task.requiredSkills)) {
        task.requiredSkills.forEach((skill) => skillsSet.add(skill));
      }
    });

    return Array.from(skillsSet);
  }, [activeTasks]);

  // Handle opening the task details modal
  const handleTaskClick = (task: CombinedCollections) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  // Close the task details modal
  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
  };

  // Handle case where charity is not found
  if (!charity) {
    return (
      <ErrorCard
        title="Charity Not Found"
        message="The charity you're looking for doesn't exist or has been removed."
        subMessage="Please check the URL or go back to explore other charities."
      />
    );
  }

  const isVolunteer = userInfo?.roles?.includes("volunteer");
  const formattedCreatedDate = charity.createdAt
    ? format(new Date(charity.createdAt), "MMMM d, yyyy")
    : null;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="relative  rounded-b-xl overflow-hidden">
        {/* Background Image */}
        {signedBackgroundPicture && (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={signedBackgroundPicture}
              alt={`${charity.name} background`}
              className="w-full h-full object-cover object-center opacity-60"
            />
          </div>
        )}
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 z-10  ">
          <div className="text-center bg-basePrimary/50 rounded-lg p-6 sm:p-8 w-fit m-auto ">
            <h1 className="text-4xl font-bold tracking-tight text-baseSecondary sm:text-5xl">
              {charity.name}
            </h1>

            {formattedCreatedDate && (
              <div className="mt-4 ">
                <span className="inline-flex items-center text-sm">
                  <Clock size={14} className="mr-1" />
                  Member since {formattedCreatedDate}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-basePrimaryLight rounded-xl p-6 shadow-sm flex flex-col items-center">
            <div className="bg-baseSecondary/10 rounded-full p-3 mb-4">
              <ClipboardText size={28} className="text-baseSecondary" />
            </div>
            <p className="text-3xl font-bold text-baseSecondary">
              {stats.activeTasks}
            </p>
            <p className="text-baseSecondary/70">Active Tasks</p>
          </div>
          <div className="bg-basePrimaryLight rounded-xl p-6 shadow-sm flex flex-col items-center">
            <div className="bg-baseSecondary/10 rounded-full p-3 mb-4">
              <CalendarCheck size={28} className="text-baseSecondary" />
            </div>
            <p className="text-3xl font-bold text-baseSecondary">
              {stats.completedTasks}
            </p>
            <p className="text-baseSecondary/70">Completed Tasks</p>
          </div>
          <div className="bg-basePrimaryLight rounded-xl p-6 shadow-sm flex flex-col items-center">
            <div className="bg-baseSecondary/10 rounded-full p-3 mb-4">
              <UsersThree size={28} className="text-baseSecondary" />
            </div>
            <p className="text-3xl font-bold text-baseSecondary">
              {stats.volunteers?.length}
            </p>
            <p className="text-baseSecondary/70">Volunteers</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          {userInfo && !localMembership && (
            <PrimaryButton
              text="Join This Charity"
              ariaLabel="Join this charity"
              action={() => setShowJoinModal(true)}
            />
          )}
          <Link to="/explore/charities">
            <SecondaryButton
              text="Explore More Charities"
              ariaLabel="Explore more charities"
            />
          </Link>
          {charity.website && (
            <a
              href="https://www.differentwebsite.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-2 border border-baseSecondary/20 rounded-lg text-baseSecondary bg-transparent hover:bg-basePrimary/5 transition-colors"
            >
              <Globe size={18} className="mr-2" />
              Visit Website
            </a>
          )}
        </div>

        {/* About Section */}
        <div className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-baseSecondary/10">
            <h2 className="text-xl font-semibold text-baseSecondary">About</h2>
          </div>
          <div className="p-6">
            <p className="text-baseSecondary/90 whitespace-pre-line">
              {charity.description ||
                "No description available for this charity."}
            </p>
          </div>
        </div>

        {/* Focus Areas Section */}
        {charity.tags && charity.tags.length > 0 && (
          <div className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-baseSecondary/10">
              <h2 className="text-xl font-semibold text-baseSecondary">
                Focus Areas
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                {charity.tags.map((tag: string, index: number) => (
                  <div
                    key={index}
                    className="bg-basePrimary/40 px-4 py-3 rounded-lg flex items-center"
                  >
                    <Target size={20} className="text-baseSecondary mr-2" />
                    <span className="text-baseSecondary">{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-baseSecondary/10">
            <h2 className="text-xl font-semibold text-baseSecondary">
              Contact Information
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {charity.website && (
              <div className="flex items-start gap-3">
                <Globe
                  size={20}
                  className="text-baseSecondary/70 mt-1 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-baseSecondary/70 mb-1">
                    Website
                  </p>
                  <a
                    href={charity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-baseSecondary hover:text-baseSecondary/80 hover:underline transition-colors"
                  >
                    {charity.website}
                  </a>
                </div>
              </div>
            )}
            {charity.contactEmail && (
              <div className="flex items-start gap-3">
                <Envelope
                  size={20}
                  className="text-baseSecondary/70 mt-1 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-baseSecondary/70 mb-1">
                    Email
                  </p>
                  <a
                    href={`mailto:${charity.contactEmail}`}
                    className="text-baseSecondary hover:text-baseSecondary/80 hover:underline transition-colors"
                  >
                    {charity.contactEmail}
                  </a>
                </div>
              </div>
            )}
            {charity.contactPerson && (
              <div className="flex items-start gap-3">
                <User
                  size={20}
                  className="text-baseSecondary/70 mt-1 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-baseSecondary/70 mb-1">
                    Contact Person
                  </p>
                  <p className="text-baseSecondary">{charity.contactPerson}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar
                size={20}
                className="text-baseSecondary/70 mt-1 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-baseSecondary/70 mb-1">
                  Joined Altruvist
                </p>
                <p className="text-baseSecondary">
                  {formattedCreatedDate || "Date not available"}
                  {charity.createdAt && (
                    <span className="text-baseSecondary/60 text-sm ml-2">
                      (
                      {formatDistanceToNow(new Date(charity.createdAt), {
                        addSuffix: true,
                      })}
                      )
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Status (if user is a member) */}
        {userInfo && localMembership && userRoles && (
          <div className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-baseSecondary/10">
              <h2 className="text-xl font-semibold text-baseSecondary">
                Your Membership
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-baseSecondary/10 p-4 rounded-lg">
                <p className="text-baseSecondary mb-2">
                  <span className="font-medium">Status:</span> Active member
                </p>
                <p className="text-baseSecondary mb-2">
                  <span className="font-medium">Joined:</span>
                  {userMembership?.joinedAt
                    ? format(new Date(userMembership.joinedAt), "MMMM d, yyyy")
                    : "Date not available"}
                </p>
                {userRoles.length > 0 && (
                  <div className="mb-2 flex flex-row items-center space-x-2">
                    <p className="font-medium text-baseSecondary mb-1">
                      Roles:
                    </p>
                    <div className="flex flex-wrap gap-2 ">
                      {userRoles.map((role, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-baseSecondary text-basePrimaryLight rounded-lg text-sm capitalize"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Skills Needed Section */}
        {requiredSkills.length > 0 ? (
          <div className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-baseSecondary/10">
              <h2 className="text-xl font-semibold text-baseSecondary">
                Skills We Need
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {requiredSkills.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-basePrimary/40 p-3 rounded-lg flex items-center justify-center"
                  >
                    <PuzzlePiece
                      size={16}
                      className="text-baseSecondary mr-2"
                    />
                    <span className="text-baseSecondary text-sm">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTasks.length > 0 ? (
          <div className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-baseSecondary/10">
              <h2 className="text-xl font-semibold text-baseSecondary">
                Skills We Need
              </h2>
            </div>
            <div className="p-6">
              <p className="text-center text-baseSecondary/70">
                This charity has active tasks, but no specific skills have been
                listed.
              </p>
            </div>
          </div>
        ) : null}

        {/* Tasks Section */}
        <CharityTasksSection
          tasks={charityTasks}
          onTaskSelect={handleTaskClick}
          charityName={charity.name}
        />

        {/* CTA Section */}
        {userInfo && !localMembership && (
          <div className="bg-baseSecondary rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 md:p-8 text-center">
              <h2 className="text-2xl font-bold !text-basePrimaryLight mb-4">
                Ready to Make a Difference?
              </h2>
              <p className="text-basePrimaryLight/90 mb-6 max-w-2xl mx-auto">
                Join {charity.name} today and start contributing your skills to
                meaningful projects that make a real impact.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {userInfo && isVolunteer && !localMembership ? (
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-6 py-3 bg-accentPrimary hover:bg-accentPrimaryDark text-baseSecondary rounded-lg transition-colors"
                  >
                    Join Now
                  </button>
                ) : !userInfo ? (
                  <Link
                    to="/zitlogin"
                    className="px-6 py-3 bg-accentPrimary hover:bg-accentPrimaryDark text-baseSecondary rounded-lg transition-colors"
                  >
                    Sign In to Join
                  </Link>
                ) : null}

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Join Charity Modal */}
      <JoinCharityModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        charityId={charity.id}
        charityName={charity.name}
        userRole={userInfo?.roles}
      />

      {/* Task Details Modal */}
      <Modal isOpen={showTaskModal} onClose={handleCloseTaskModal}>
        {selectedTask && (
          <TaskDetailsCard
            category={selectedTask.category || []}
            charityName={charity.name}
            charityId={charity.id}
            id={selectedTask.id || ""}
            description={selectedTask.description || ""}
            title={selectedTask.title || ""}
            impact={selectedTask.impact || ""}
            requiredSkills={selectedTask.requiredSkills || []}
            urgency={selectedTask.urgency || "LOW"}
            volunteersNeeded={selectedTask.volunteersNeeded || 0}
            deliverables={selectedTask.deliverables || []}
            deadline={new Date(selectedTask.deadline || Date.now())}
            userId={selectedTask.userId || ""}
            status={selectedTask.status || ""}
            resources={selectedTask.resources || []}
            userRole={userInfo?.roles || []}
            volunteerDetails={{
              userId: userInfo?.id || "",
              taskApplications: taskApplications || [],
            }}
            taskApplications={selectedTask.taskApplications || []}
          />
        )}
      </Modal>
    </div>
  );
}
