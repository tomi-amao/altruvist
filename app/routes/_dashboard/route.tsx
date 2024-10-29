import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";

import { ProfileCard } from "~/components/cards/ProfileCard";
import Navbar from "~/components/navigation/Header2";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken"); //retrieve access token from session to be used as bearer token

  if (!accessToken) {
    return redirect("/zitlogin");
  }
  const { userInfo, error } = await getUserInfo(accessToken);
  if (!userInfo) {
    return redirect("/zitlogin");
  }

  return { userInfo, error };
}
export default function Dashboard() {
  const role = "charity";

  const getSideBarMenu = (role: string) => {
    switch (role) {
      case "charity":
        return ["Dashboard", "Manage Tasks", "Messages", "Feeds", "Explore"];
      case "techie":
        return ["Dashboard", "Tasks", "Messages", "Feeds", "Explore"];
      default:
        break;
    }
  };
  const sideBarMenu = getSideBarMenu(role) ?? [
    "Dashboard",
    "Tasks",
    "Messages",
    "Feeds",
    "Explore",
    "Logout",
  ];

  const location = useLocation();
  console.log(location.pathname);

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

  const { userInfo } = useLoaderData<typeof loader>();

  return (
    <>
      <div className=" h-full lg:h-screen flex flex-row  ">
        <Navbar isLoggedIn={userInfo.id ? true : false} />
        <div className=" flex w-3/12 lg:max-w-48 space-y-4 mt-[3.8rem] lg:mt-[4rem] p-4  border-r-[1px] border-baseSecondary min-h-full">
          <div>
            <ProfileCard
              name={userInfo?.name}
              techTitle={userInfo?.techTitle}
            />
            <nav className=" flex flex-col justify-between">
              <ul className=" flex flex-col h-screen gap-1 ">
                {sideBarMenu.map((link, index) => (
                  <Link
                    to={getLink(link)}
                    key={index}
                    className={`p-2 px-4  hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md ${location.pathname === getLink(link) ? "bg-baseSecondary text-basePrimary" : "text-baseSecondary"}`}
                  >
                    {link}
                  </Link>
                ))}
                <Link to={"/zitlogout"}>Logout</Link>
              </ul>
            </nav>
          </div>
        </div>
        <div className="w-full  mt-20">
          <Outlet></Outlet>
        </div>
      </div>
    </>
  );
}
