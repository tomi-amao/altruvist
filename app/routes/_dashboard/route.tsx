import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { SimpleProfileCard } from "~/components/cards/ProfileCard";
import Navbar from "~/components/navigation/Header2";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken"); //retrieve access token from session to be used as bearer token
  let returnTo: string;

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

  return { userInfo, error };
}
export default function Dashboard() {
  const { userInfo } = useLoaderData<typeof loader>();
  const role = userInfo.roles[0];
  const location = useLocation();
  const [signedProfilePicture, setSignedProfilePicture] = useState<
    string | null
  >(null);

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

  useEffect(() => {
    async function fetchSignedUrl() {
      const res = await fetch(
        `/api/s3-get-url?file=${userInfo.profilePicture}&action=upload`,
      );
      const data = await res.json();
      if (data.url) {
        setSignedProfilePicture(data.url);
      }
    }
    fetchSignedUrl();
  }, [userInfo.profilePicture]);

  return (
    <>
      <div className="h-full lg:h-screen flex flex-row">
        <Navbar userId={userInfo.id} />
        <div className="hidden lg:flex w-3/12 lg:max-w-48 flex-col mt-[3.8rem] lg:mt-[4rem] p-4 min-h-full lg:fixed shadow-md bg-basePrimary">
          {/* Profile section */}
          <div className="mb-6">
            <SimpleProfileCard
              name={userInfo?.name}
              userTitle={userInfo?.userTitle}
              profilePicture={signedProfilePicture || userInfo?.profilePicture}
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

          {/* Logout section - Now separate from the main navigation */}
        </div>

        <div className="w-full mt-20 lg:ml-48">
          <Outlet />
        </div>
      </div>
    </>
  );
}
