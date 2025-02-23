import { LoaderFunctionArgs } from "@remix-run/node";
import { MetaFunction, useLoaderData } from "@remix-run/react";
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

export const meta: MetaFunction = () => {
  return [{ title: "Profile" }];
};

export default function ProfilePage() {
  const {
    profileInfo,
    userInfo,
    completedTasks,
    createdTasks,
    taskApplications,
    FEATURE_FLAG,
  } = useLoaderData<typeof loader>();

  const [showSelectedTask, setShowSelectedTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CombinedCollections>();
  const [signedProfilePicture, setSignedProfilePicture] = useState<
    string | null
  >(null);

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

  if (!profileInfo) {
    // Handle case when post is not found
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

  return (
    <>
      <div className="md:flex-row md:flex flex-col items-center md:items-start">
        <div className="bg-basePrimaryDark md:w-8/12 flex flex-col md:flex-shrink-0 p-4 rounded-md ">
          <div className="flex items-center gap-2 justify-between flex-row ">
            <Avatar
              src={signedProfilePicture||profileInfo?.profilePicture}
              name={profileInfo.name}
              size={130}
            />
            <div className="flex-col  w-full">
              <p className="font-bold text-2xl "> {profileInfo?.name}</p>
              <p>{profileInfo.charity?.name || "Profile Title Placeholder"}</p>
              <p>{profileInfo?.roles[0]}</p>
            </div>
            {FEATURE_FLAG && (
              <div className="bg-basePrimaryLight rounded-md md:flex  w-fit md:self-end self-start  flex-wrap hidden">
                <button className="text-right w-fit py-2 px-8 text-baseSecondary   font-semibold">
                  Message
                </button>
              </div>
            )}
          </div>
          <div className="p-2 py-4">
            <p className="font-semibold border-b-[1px]">About</p>
            <p className="mt-2">
              {profileInfo?.bio || "Profile Bio Placeholder"}
            </p>
          </div>
        </div>
        <div className="w-full flex flex-col gap-4">
          {/* Charity Details Card */}
          {profileInfo.roles[0] === "charity" && profileInfo.charity && (
            <div className="bg-basePrimaryDark md:mx-4 rounded-md p-4 flex-col space-y-4">
              <h2 className="font-semibold border-b-[1px] pb-2">
                {profileInfo.charity.name}
              </h2>

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-baseSecondary font-bold">
                    Description
                  </p>
                  <p>{profileInfo.charity.description}</p>
                </div>

                {profileInfo.charity.website && (
                  <div>
                    <p className="text-sm font-bold">Website</p>
                    <a
                      href={profileInfo.charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-baseSecondary hover:underline"
                    >
                      {profileInfo.charity.website}
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-sm font-bold">Tags</p>
                  {profileInfo.charity?.tags?.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="bg-basePrimary rounded-md p-1 px-2"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {profileInfo.charity.contactPerson && (
                  <div>
                    <p className="text-sm text-gray-400">Contact Person</p>
                    <p>{profileInfo.charity.contactPerson}</p>
                  </div>
                )}

                {profileInfo.charity.contactEmail && (
                  <div>
                    <p className="text-sm text-gray-400">Contact Email</p>
                    <a
                      href={`mailto:${profileInfo.charity.contactEmail}`}
                      className="text-baseSecondary hover:underline"
                    >
                      {profileInfo.charity.contactEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Volunteer Details Card */}
          {profileInfo.roles[0] === "volunteer" && (
            <div className="bg-basePrimaryDark md:mx-4 rounded-md p-4 flex-col space-y-4">
              <h2 className="font-semibold border-b-[1px] pb-2">
                Volunteer Statistics
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-baseSecondary font-bold">
                    Completed Tasks
                  </p>
                  <p className="text-xl">{completedTasks?.length || 0}</p>
                </div>

                <div>
                  <p className="text-sm text-baseSecondary font-bold">
                    Preferred Charities
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {profileInfo.preferredCharities
                      ?.slice(0, 2)
                      .map((charity) => (
                        <span
                          key={charity}
                          className="bg-basePrimary rounded-md p-1 px-2 text-sm"
                        >
                          {charity}
                        </span>
                      ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-baseSecondary font-bold">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {profileInfo.skills.map((skill, index) => (
                      <span
                        className="bg-basePrimary rounded-md p-1 px-2 text-sm"
                        key={index}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {
        <div className="py-4">
          {completedTasks?.length === 0 ? (
            <p className="text-center">No completed tasks yet</p>
          ) : (
            <>
              <h1 className="">
                {profileInfo.roles[0] === "charity"
                  ? "Created Tasks"
                  : "Completed Tasks"}
              </h1>
              <DataTable
                data={
                  profileInfo.roles[0] === "charity"
                    ? createdTasks
                    : completedTasks
                }
                handleRowClick={(item) => handleRowClick(item)}
                itemsPerPage={5}
              />
            </>
          )}
        </div>
      }

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
    </>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const url = new URL(request.url);

  const profileId = url.pathname.split("/")[2];
  const profileInfo = await getProfileInfo(profileId);
  const profileRole = profileInfo?.roles[0];
  const { FEATURE_FLAG } = getFeatureFlags();

  if (!profileRole) {
    return {
      userInfo: null,
      profileInfo: null,
      completedTasks: null,
      createdTasks: null,
      taskApplications: null,
      FEATURE_FLAG,
    };
  }

  const { userInfo } = await getUserInfo(accessToken);

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
    const { tasks, status } = await getUserTasks(
      profileRole,
      "ACCEPTED",
      profileId,
    );
    console.log("Status", status);

    const completedTasks = tasks?.filter((task) => task.status === "COMPLETED");

    // Make sure task applications are included in the task data
    // const tasksWithApplications = completedTasks?.map(task => ({
    //   ...task,
    //   taskApplications: task.taskApplications || []
    // }));

    // console.log("Completed Tasks", completedTasks);

    return {
      userInfo,
      profileInfo,
      completedTasks,
      createdTasks: null,
      taskApplications,
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
    FEATURE_FLAG,
  };
}
