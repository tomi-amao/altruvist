import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { SimpleProfileCard } from "~/components/cards/ProfileCard";
import Navbar from "~/components/navigation/Header2";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import { getSignedUrlForFile } from "~/services/s3.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  let returnTo: string;
  const novuAppId = process.env.NOVU_APP_ID;

  if (request.headers.get("referer") !== "/" || null) {
    returnTo = "/";
  } else {
    const url = new URL(request.headers.get("referer") || "");
    returnTo = url.pathname;
    console.log("return to", request.headers.get("referer"));
    console.log(url.pathname);
  }

  if (!accessToken) {
    return redirect(`/zitlogin?returnTo=${encodeURIComponent(returnTo)}`);
  }
  const { userInfo, error } = await getUserInfo(accessToken);
  if (!userInfo) {
    return redirect("/zitlogin");
  }

  let signedProfilePictureUrl: string | null = null;
  if (userInfo.profilePicture) {
    try {
      signedProfilePictureUrl = await getSignedUrlForFile(userInfo.profilePicture, true);
    } catch (e) {
      console.error("Failed to get signed URL for profile picture:", e);
    }
  }

  return { userInfo, error, novuAppId, signedProfilePictureUrl };
}

export default function Dashboard() {
  const { userInfo, novuAppId, signedProfilePictureUrl } = useLoaderData<typeof loader>();
  const role = userInfo.roles[0];
  const location = useLocation();

  const getSideBarMenu = (role: string) => {
    switch (role) {
      case "charity":
        return ["Dashboard", "Manage Tasks", "Explore"];
      case "volunteer":
        return ["Dashboard", "Tasks", "Explore"];
      default:
        return ["Dashboard", "Tasks", "Messages", "Feeds", "Explore"];
    }
  };

  const sideBarMenu = getSideBarMenu(role);

  const getLink = (link: string) => {
    switch (link) {
      case "Dashboard":
      case "Explore":
        return `/${link.toLowerCase()}`;
      case "Manage Tasks":
        return `/dashboard/tasks`;
      default:
        return `/dashboard/${link.toLowerCase()}`;
    }
  };

  return (
    <>
      <div className="h-full lg:h-screen flex flex-row">
        <Navbar userId={userInfo.id} novuAppId={novuAppId ?? ""} />
        <div className="hidden lg:flex w-3/12 lg:max-w-48 flex-col mt-[3.8rem] lg:mt-[4rem] p-4 min-h-full lg:fixed shadow-md bg-basePrimary">
          {/* Profile section */}
          <div className="mb-6">
            <SimpleProfileCard
              name={userInfo?.name}
              userTitle={userInfo?.userTitle}
              profilePicture={signedProfilePictureUrl}
              className="hover:shadow-md transition-shadow duration-200"
            />
          </div>

          {/* Navigation section */}
          <nav className="flex-1" data-testid="dashboard-nav">
            <ul className="flex flex-col gap-1">
              {sideBarMenu.map((link, index) => (
                <Link
                  to={getLink(link)}
                  key={index}
                  className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200 
                    ${
                      location.pathname === getLink(link)
                        ? "bg-baseSecondary text-basePrimary"
                        : "text-baseSecondary"
                    }`}
                >
                  {link}
                </Link>
              ))}
            </ul>
          </nav>
        </div>

        <div className="w-full mt-20 lg:ml-48">
          <Outlet />
        </div>
      </div>
    </>
  );
}
