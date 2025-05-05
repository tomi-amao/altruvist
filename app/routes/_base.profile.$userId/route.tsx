import { LoaderFunctionArgs } from "@remix-run/node";
import {
  MetaFunction,
  useLoaderData,
  Link,
  useFetcher,
} from "@remix-run/react";
import { getProfileInfo, getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import DataTable from "~/components/cards/DataTable";
import TaskDetailsCard from "~/components/tasks/taskDetailsCard";
import { Modal } from "~/components/utils/Modal2";
import { useEffect, useState } from "react";
import { CombinedCollections } from "~/types/tasks";
import { getUserTasks } from "~/models/tasks.server";
import { Avatar } from "~/components/cards/ProfileCard";
import { getFeatureFlags } from "~/services/env.server";
import { ErrorCard } from "~/components/utils/ErrorCard";
import { PrimaryButton, SecondaryButton } from "~/components/utils/BasicButton";
import {
  User,
  Globe,
  Envelope,
  ChartBar,
  FileText,
  Buildings,
  CalendarBlank,
} from "@phosphor-icons/react";
import { getSignedUrlForFile } from "~/services/s3.server";
import { Alert } from "~/components/utils/Alert";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.profileInfo) {
    return [
      { title: "Profile Not Found | Altruvist" },
      {
        name: "description",
        content: "This profile could not be found on Altruvist.",
      },
    ];
  }

  const profileName = data.profileInfo.name;
  const profileRole = data.profileInfo.roles[0];
  const isCharity = profileRole === "charity";

  return [
    {
      title: `${profileName} | ${isCharity ? "Charity" : "Volunteer"} Profile | Altruvist`,
    },
    {
      name: "description",
      content: isCharity
        ? `View ${profileName}'s charity profile, tasks, and mission on Altruvist.`
        : `View ${profileName}'s volunteer profile, completed tasks, and skills on Altruvist.`,
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

export default function ProfilePage() {
  const {
    profileInfo,
    userInfo,
    completedTasks,
    createdTasks,
    taskApplications,
    FEATURE_FLAG,
    charityMemberships,
    signedProfilePicture,
  } = useLoaderData<typeof loader>();

  const [showSelectedTask, setShowSelectedTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CombinedCollections>();
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState<{
    charityId: string;
    charityName: string;
  } | null>(null);

  const fetcher = useFetcher();
  const leavingCharityId =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("action") === "leave"
      ? (fetcher.formData.get("charityId") as string)
      : null;

  // Clear error message when fetcher state changes
  useEffect(() => {
    if (fetcher.data && fetcher.data.success === false) {
      setLeaveError(fetcher.data.message);
    } else if (fetcher.data && fetcher.data.success === true) {
      setLeaveError(null);
    }
  }, [fetcher.data]);

  if (!profileInfo) {
    return (
      <ErrorCard
        message="Search for another profile"
        title={"Profile not found"}
        subMessage={""}
      />
    );
  }

  const handleCloseModal = () => {
    setShowSelectedTask(false);
  };

  const handleRowClick = (selectedTaskData: CombinedCollections) => {
    setShowSelectedTask((preValue) => !preValue);
    setSelectedTask(selectedTaskData);
  };

  const handleLeaveCharity = (charityId: string, charityName: string) => {
    setAlertData({ charityId, charityName });
    setShowAlert(true);
  };

  const confirmLeaveCharity = () => {
    if (alertData) {
      setLeaveError(null);
      fetcher.submit(
        {
          action: "leave",
          charityId: alertData.charityId,
        },
        {
          method: "post",
          action: "/api/charity-membership",
        },
      );
    }
    setShowAlert(false);
  };

  const isMyProfile = userInfo?.id === profileInfo.id;
  const isCharity = profileInfo.roles[0] === "charity";
  const isVolunteer = profileInfo.roles[0] === "volunteer";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Card with Avatar and Basic Info */}
      <div className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-lg mb-8">
        {/* Background Banner */}
        <div className="h-32 bg-gradient-to-r from-baseSecondary/60 to-baseSecondary/90"></div>

        <div className="px-6 pb-6 relative">
          {/* Profile Avatar */}
          <div className="absolute -top-16 left-6 border-4 border-basePrimaryLight rounded-full ">
            <Avatar
              src={signedProfilePicture || profileInfo?.profilePicture}
              name={profileInfo.name}
              size={130}
            />
          </div>

          {/* Profile Header Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-20 sm:items-center ">
            <div>
              <h1 className="text-3xl font-bold text-baseSecondary mb-1">
                {profileInfo?.name}
              </h1>
              <div className="flex items-center gap-2 text-baseSecondary/70">
                {isCharity ? (
                  <Buildings size={18} weight="regular" />
                ) : (
                  <User size={18} weight="regular" />
                )}
                <span className="capitalize text-baseSecondary/80">
                  {profileInfo.roles[0]}
                </span>
                {isCharity && profileInfo.charity && (
                  <span className="text-baseSecondary/80">
                    · {profileInfo.charity.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4 sm:mt-0">
              {isMyProfile && (
                <Link to="/account/settings">
                  <SecondaryButton
                    text="Edit Profile"
                    ariaLabel="Edit your profile"
                  />
                </Link>
              )}

              {FEATURE_FLAG && !isMyProfile && (
                <PrimaryButton text="Message" ariaLabel="Send a message" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Profile Info */}
        <div className="md:col-span-1 space-y-6">
          {/* About Card */}
          <div className="bg-basePrimaryLight rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-baseSecondary/10">
              <h2 className="text-xl font-semibold text-baseSecondary">
                About
              </h2>
            </div>
            <div className="p-6">
              <p className="text-baseSecondary/90 whitespace-pre-line">
                {profileInfo?.bio || "No bio information available."}
              </p>
            </div>
          </div>

          {/* Charity Memberships Card */}
          {(isMyProfile || charityMemberships.memberships?.length > 0) && (
            <div className="bg-basePrimaryLight rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-baseSecondary/10 flex justify-between items-center">
                <h2 className="text-7xl font-semibold  text-baseSecondary flex items-center gap-2">
                  Charity Memberships
                </h2>
                {isMyProfile && isVolunteer && (
                  <Link
                    to="/explore/charities"
                    className="text-sm text-baseSecondary font-medium hover:text-baseSecondary/80 hover:underline transition-colors"
                  >
                    Find Charities
                  </Link>
                )}
              </div>
              <div className="p-6">
                {charityMemberships.memberships?.length > 0 ? (
                  <div className="space-y-4">
                    {charityMemberships?.memberships.map((membership) => (
                      <div
                        key={membership.id}
                        className="flex items-start gap-3 bg-basePrimary/50 p-3 rounded-lg"
                      >
                        <Buildings
                          size={24}
                          className="text-baseSecondary mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <Link
                              to={`/charity/${membership.charity.id}`}
                              className="text-md font-medium text-baseSecondary hover:underline"
                            >
                              {membership.charity.name}
                            </Link>
                            {isMyProfile && (
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleLeaveCharity(
                                      membership.charityId,
                                      membership.charity.name,
                                    );
                                  }}
                                  className={`text-xs ${
                                    leavingCharityId === membership.charityId
                                      ? "text-dangerPrimaryDark"
                                      : "text-dangerPrimary hover:text-dangerPrimaryDark"
                                  } transition-colors`}
                                  aria-label="Leave charity"
                                  title="Leave charity"
                                  disabled={!!leavingCharityId}
                                >
                                  {leavingCharityId === membership.charityId
                                    ? "Leaving..."
                                    : "Leave"}
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1 ">
                            {membership.roles.map((role, idx) => (
                              <span
                                key={idx}
                                className="text-xs   bg-accentPrimary px-2 py-0.5 rounded-full capitalize"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-baseSecondary/70">
                    {isMyProfile && isVolunteer ? (
                      <>
                        <p className="mb-3">
                          You haven't joined any charities yet.
                        </p>
                        <Link
                          to="/explore/charities"
                          className="inline-block bg-baseSecondary text-basePrimaryLight px-4 py-2 rounded-md hover:bg-baseSecondary/90 transition-colors"
                        >
                          Explore Charities
                        </Link>
                      </>
                    ) : (
                      <p>No charity memberships to display.</p>
                    )}
                  </div>
                )}
                {leaveError && (
                  <div className="text-center text-dangerPrimary mt-4">
                    {leaveError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact & Details Card */}
          {isCharity && profileInfo.charity && (
            <div className="bg-basePrimaryLight rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-baseSecondary/10">
                <h2 className="text-xl font-semibold text-baseSecondary">
                  Charity Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {profileInfo.charity.website && (
                  <div className="flex items-start gap-3">
                    <Globe
                      size={20}
                      className="text-baseSecondary/70 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-baseSecondary/70 mb-1">
                        Website
                      </p>
                      <a
                        href={profileInfo.charity.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-baseSecondary hover:text-baseSecondary/80 hover:underline transition-colors"
                      >
                        {profileInfo.charity.website}
                      </a>
                    </div>
                  </div>
                )}

                {profileInfo.charity.contactPerson && (
                  <div className="flex items-start gap-3">
                    <User
                      size={20}
                      className="text-baseSecondary/70 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-baseSecondary/70 mb-1">
                        Contact Person
                      </p>
                      <p className="text-baseSecondary">
                        {profileInfo.charity.contactPerson}
                      </p>
                    </div>
                  </div>
                )}

                {profileInfo.charity.contactEmail && (
                  <div className="flex items-start gap-3">
                    <Envelope
                      size={20}
                      className="text-baseSecondary/70 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-baseSecondary/70 mb-1">
                        Contact Email
                      </p>
                      <a
                        href={`mailto:${profileInfo.charity.contactEmail}`}
                        className="text-baseSecondary hover:text-baseSecondary/80 hover:underline transition-colors"
                      >
                        {profileInfo.charity.contactEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills & Interests Card for Volunteers */}
          {isVolunteer && (
            <div className="bg-basePrimaryLight rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-baseSecondary/10">
                <h2 className="text-xl font-semibold text-baseSecondary">
                  Skills & Interests
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {profileInfo.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-baseSecondary/70 mb-2">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profileInfo.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-basePrimary rounded-full px-3 py-1 text-sm text-baseSecondary"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profileInfo.preferredCharities?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-baseSecondary/70 mb-2">
                      Preferred Charities
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profileInfo.preferredCharities.map((charity, index) => (
                        <span
                          key={index}
                          className="bg-basePrimary rounded-full px-3 py-1 text-sm text-baseSecondary"
                        >
                          {charity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags Card for Charities */}
          {isCharity && profileInfo.charity?.tags?.length > 0 && (
            <div className="bg-basePrimaryLight rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-baseSecondary/10">
                <h2 className="text-xl font-semibold text-baseSecondary">
                  Focus Areas
                </h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {profileInfo.charity.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-basePrimary rounded-full px-3 py-1 text-sm text-baseSecondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stats Card for Volunteers */}
          {isVolunteer && (
            <div className="bg-basePrimaryLight rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-baseSecondary/10">
                <h2 className="text-xl font-semibold text-baseSecondary">
                  <div className="flex items-center gap-2">
                    <ChartBar size={20} />
                    <span>Statistics</span>
                  </div>
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-basePrimary rounded-lg p-4 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-baseSecondary mb-1">
                      {completedTasks?.length || 0}
                    </p>
                    <p className="text-sm text-baseSecondary/70">
                      Completed Tasks
                    </p>
                  </div>
                  <div className="bg-basePrimary rounded-lg p-4 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-baseSecondary mb-1">
                      {profileInfo.skills.length}
                    </p>
                    <p className="text-sm text-baseSecondary/70">Skills</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Tasks */}
        <div className="md:col-span-2">
          <div className="bg-basePrimaryLight rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-baseSecondary/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-baseSecondary flex items-center gap-2">
                  <FileText size={22} />
                  <span>{isCharity ? "Created Tasks" : "Completed Tasks"}</span>
                </h2>
                <span className="bg-basePrimary rounded-full px-3 py-1 text-sm font-medium text-baseSecondary">
                  {(isCharity
                    ? createdTasks?.length
                    : completedTasks?.length) || 0}{" "}
                  {""}
                  Tasks
                </span>
              </div>
            </div>

            <div className="p-6">
              {isCharity && (!createdTasks || createdTasks.length === 0) && (
                <p className="text-center py-6 text-baseSecondary/70">
                  No tasks created yet.
                </p>
              )}

              {isVolunteer &&
                (!completedTasks || completedTasks.length === 0) && (
                  <p className="text-center py-6 text-baseSecondary/70">
                    No completed tasks yet.
                  </p>
                )}

              {((isCharity && createdTasks && createdTasks.length > 0) ||
                (isVolunteer &&
                  completedTasks &&
                  completedTasks.length > 0)) && (
                <div className="overflow-x-auto">
                  <DataTable
                    data={isCharity ? createdTasks || [] : completedTasks || []}
                    handleRowClick={(item) => handleRowClick(item)}
                    itemsPerPage={5}
                    columns={[
                      {
                        key: "title",
                        header: "Title",
                        render: (item) => (
                          <div className="text-sm font-medium text-baseSecondary">
                            {item.title}
                          </div>
                        ),
                        wrap: false,
                      },
                      {
                        key: "description",
                        header: "Description",
                        render: (item) => (
                          <div className="text-sm text-baseSecondary/80 truncate max-w-xs">
                            {item.description}
                          </div>
                        ),
                      },
                      // {
                      //   key: 'urgency',
                      //   header: 'Urgency',
                      //   render: (item) => (
                      //     <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      //       ${item.urgency === 'HIGH' ? 'bg-dangerPrimary/20 text-dangerPrimary' :
                      //         item.urgency === 'MEDIUM' ? 'bg-indicator-orange/20 text-indicator-orange' :
                      //         'bg-baseSecondary/10 text-baseSecondary'}`}>
                      //       {item.urgency}
                      //     </div>
                      //   )
                      // },
                      {
                        key: "status",
                        header: "Status",
                        render: (item) => (
                          <div
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                            ${
                              item.status === "OPEN"
                                ? "bg-confirmPrimary/20 text-confirmPrimary"
                                : item.status === "IN_PROGRESS"
                                  ? "bg-indicator-blue/20 text-indicator-blue"
                                  : item.status === "COMPLETED"
                                    ? "bg-indicator-green/20 text-indicator-green"
                                    : "bg-baseSecondary/10 text-baseSecondary"
                            }`}
                          >
                            {item.status?.replace("_", " ")}
                          </div>
                        ),
                        wrap: false,
                      },
                      // {
                      //   key: 'deadline',
                      //   header: 'Deadline',
                      //   render: (item) => (
                      //     <div className="text-sm text-baseSecondary/80">
                      //       {new Date(item.deadline).toLocaleDateString()}
                      //     </div>
                      //   )
                      // }
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      <Modal isOpen={showSelectedTask} onClose={handleCloseModal}>
        <div>
          <TaskDetailsCard
            category={selectedTask?.category || []}
            charityName={selectedTask?.charity?.name || ""}
            charityId={selectedTask?.charityId || ""}
            id={selectedTask?.id || ""}
            description={selectedTask?.description || ""}
            title={selectedTask?.title || ""}
            impact={selectedTask?.impact || ""}
            requiredSkills={selectedTask?.requiredSkills || []}
            urgency={selectedTask?.urgency || "LOW"}
            volunteersNeeded={selectedTask?.volunteersNeeded || 0}
            deliverables={selectedTask?.deliverables || []}
            deadline={new Date(selectedTask?.deadline || Date.now())}
            userId={selectedTask?.userId || ""}
            status={selectedTask?.status || ""}
            resources={selectedTask?.resources || []}
            userRole={userInfo?.roles || []}
            volunteerDetails={{
              userId: userInfo?.id || "",
              taskApplications: taskApplications || [],
            }}
            taskApplications={selectedTask?.taskApplications || []}
          />
        </div>
      </Modal>

      {/* Alert Modal */}
      {showAlert && alertData && (
        <Alert
          isOpen={showAlert}
          onClose={() => setShowAlert(false)}
          title="Leave Charity"
          message={`Are you sure you want to leave ${alertData.charityName}?`}
          confirmText="Leave"
          onConfirm={confirmLeaveCharity}
          variant="danger"
        />
      )}
    </div>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const url = new URL(request.url);

  const profileId = url.pathname.split("/")[2];

  // Get profile info with charity memberships
  const { profile: profileInfo, charityMemberships } =
    await getProfileInfo(profileId);
  const profileRole = profileInfo?.roles[0];
  const { FEATURE_FLAG } = getFeatureFlags();

  if (!profileRole) {
    return {
      userInfo: null,
      profileInfo: null,
      completedTasks: null,
      createdTasks: null,
      taskApplications: null,
      charityMemberships: { memberships: [] },
      FEATURE_FLAG,
    };
  }

  const { userInfo } = await getUserInfo(accessToken);
  const signedProfilePicture = await getSignedUrlForFile(
    profileInfo.profilePicture || "",
    true,
  );

  // Get logged in user's task applications if they are a volunteer
  let taskApplications = null;
  if (userInfo?.roles[0] === "volunteer") {
    const { tasks: userTasks } = await getUserTasks(
      userInfo.roles[0],
      undefined,
      userInfo.id,
    );
    taskApplications = userTasks?.map((task) => task.id) || [];
  }

  if (profileRole === "volunteer") {
    const { tasks } = await getUserTasks(profileRole, "ACCEPTED", profileId);

    const completedTasks = tasks?.filter((task) => task.status === "COMPLETED");

    return {
      userInfo,
      profileInfo,
      completedTasks,
      createdTasks: null,
      taskApplications,
      signedProfilePicture,
      charityMemberships,
      FEATURE_FLAG,
    };
  } else if (profileRole === "charity") {
    const { tasks: createdTasks } = await getUserTasks(
      profileRole,
      undefined,
      profileId,
    );

    // Make sure task applications are included in the task data
    const tasksWithApplications = createdTasks?.map((task) => ({
      ...task,
      taskApplications: task.taskApplications || [],
    }));

    return {
      userInfo,
      profileInfo,
      completedTasks: null,
      createdTasks: tasksWithApplications,
      charityMemberships,
      signedProfilePicture,
      taskApplications,
      FEATURE_FLAG,
    };
  }

  return {
    userInfo: null,
    profileInfo: null,
    completedTasks: null,
    createdTasks: null,
    taskApplications: null,
    charityMemberships: { memberships: [] },
    signedProfilePicture,
    FEATURE_FLAG,
  };
}
