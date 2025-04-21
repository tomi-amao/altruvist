// filepath: /home/ignorantview/projects/web-applications/skillanthropy/app/routes/task.$taskId/route.tsx
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigation, Link } from "@remix-run/react";
import { getTask } from "~/models/tasks.server";
import TaskDetailsCard from "~/components/tasks/taskDetailsCard";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import { ArrowLeft } from "@phosphor-icons/react";
import { useViewport } from "~/hooks/useViewport";
import { ServerRuntimeMetaFunction as MetaFunction } from "@remix-run/server-runtime";

export const meta: MetaFunction = ({ data }) => {
  return [
    { title: data?.task ? `${data.task.title} | Skillanthropy` : "Task Details | Skillanthropy" },
    { name: "description", content: data?.task?.description || "Detailed information about a volunteer task" },
  ];
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  // Extract taskId from URL params
  const taskId = params.taskId;

  if (!taskId) {
    return json({
      error: "Task ID is required",
      status: 400,
      task: null,
      userAuthenticated: false,
      userRole: [],
    });
  }

  try {
    // Check if user is authenticated
    const session = await getSession(request);
    const accessToken = session.get("accessToken");
    let userInfo = null;
    let userAuthenticated = false;
    let userRole = [];
    let volunteerId = null;
    let volunteerDetails = null;

    // If user is authenticated, get their info
    if (accessToken) {
      try {
        const { userInfo: fetchedUserInfo } = await getUserInfo(accessToken);
        userInfo = fetchedUserInfo;
        userAuthenticated = !!userInfo?.id;
        userRole = userInfo?.roles || [];
        volunteerId = userInfo?.id;
        
        // If user is a volunteer, prepare volunteer details
        if (userRole.includes("volunteer") && volunteerId) {
          volunteerDetails = {
            userId: volunteerId,
            taskApplications: [], // Will be populated below if user has applied to this task
          };
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        // Continue without user info
      }
    }

    // Fetch the task data
    const task = await getTask(taskId);

    if (!task) {
      return json({
        error: "Task not found",
        status: 404,
        task: null,
        userAuthenticated,
        userRole,
      }, { status: 404 });
    }

    // If user is authenticated and is a volunteer, check if they have applied to this task
    if (userAuthenticated && userRole.includes("volunteer") && volunteerId && volunteerDetails) {
      // Check if user has applied to this task
      if (task.taskApplications && task.taskApplications.length > 0) {
        const userApplications = task.taskApplications.filter(app => app.userId === volunteerId);
        if (userApplications.length > 0) {
          volunteerDetails.taskApplications = [taskId];
        }
      }
    }

    return json({
      task,
      status: 200,
      userAuthenticated,
      userRole,
      volunteerDetails,
    });
  } catch (error) {
    console.error("Error fetching task details:", error);
    return json({
      error: "Failed to fetch task details",
      status: 500,
      task: null,
      userAuthenticated: false,
      userRole: [],
    }, { status: 500 });
  }
}

export default function TaskDetailPage() {
  const { 
    task, 
    userAuthenticated, 
    userRole = [], 
    error,
    volunteerDetails
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const { isMobile } = useViewport();
  
  const isLoading = navigation.state === "loading";

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 md:p-8 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-baseSecondary/30 border-t-baseSecondary rounded-full animate-spin mb-4"></div>
          <p className="text-baseSecondary/80">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container mx-auto p-4 sm:p-6 md:p-8 flex flex-col items-center">
        <div className="bg-basePrimary rounded-xl shadow-lg p-8 max-w-2xl w-full mx-auto text-center">
          <div className="flex flex-col items-center text-dangerPrimary mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-semibold mb-2">Task Not Found</h2>
            <p className="text-baseSecondary/80">{error || "The requested task could not be found"}</p>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center px-5 py-2.5 rounded-md bg-baseSecondary text-basePrimary hover:bg-baseSecondary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-baseSecondary"
          >
            Explore Available Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-baseSecondary hover:text-baseSecondary/80 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Explore</span>
        </Link>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <TaskDetailsCard
          taskId={task.id}
          userRole={userRole}
          volunteerDetails={volunteerDetails}
        />
        
        {!userAuthenticated && (
          <div className="mt-8 p-6 bg-basePrimaryLight rounded-lg shadow-md text-center">
            <h3 className="text-xl font-semibold text-baseSecondary mb-3">
              Want to volunteer for this task?
            </h3>
            <p className="text-baseSecondary/80 mb-4">
              You need to be logged in as a volunteer to apply for this task.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/zitlogin"
                className="px-6 py-3 bg-baseSecondary text-basePrimary rounded-md hover:bg-baseSecondary/90 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/newuser"
                className="px-6 py-3 bg-basePrimaryDark text-baseSecondary border border-baseSecondary/20 rounded-md hover:border-baseSecondary/40 transition-colors"
              >
                Create an Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}