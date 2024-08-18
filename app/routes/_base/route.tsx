import { LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { useState } from "react";
import { ProfileCard } from "~/components/cards/ProfileCard";
import Header from "~/components/navigation/Header";
import { DisplayPicture } from "~/components/utils/DisplayPicture";
import { TrendingIcon } from "~/components/utils/icons";
import { getUserById, requireUserId } from "~/models/user.server";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function IndexLayout() {
  const location = useLocation();
  const pathName = location.pathname.slice(1);

  const { userDetails, userId } = useLoaderData<typeof loader>();
  const [showSidebar, setShowSidebar] = useState(true);
  const sideBarOptions = ["feed", "dashboard", "messages"];

  return (
    <>
      <div className="">
        <Header
          userDetails={userDetails}
          userId={userId}
          setShowSidebar={setShowSidebar}
        />
        <div className="flex ">
          {showSidebar && (
            <div className="w-[25%] h-screen text-lightGrey border-r-2  border-midGrey ">
              <div className="flex flex-col items-center pt-4">
                <DisplayPicture
                  imgURL={userDetails?.profile?.profilePicture}
                  imgSize="45"
                  imgFallback=""
                />
                <h2>{userDetails?.profile?.username}</h2>
                {/* <h3 className="text-altMidGrey">
                  {userDetails?.profile?.type ?? "Expert"}
                </h3> */}
              </div>
              <nav className="p-4 flex flex-col">
                {/* use the pathname to conditionally show active sidebar option */}
                {sideBarOptions.map((option, index) =>
                  pathName === option ? (
                    <NavLink
                      key={index}
                      className="cursor-pointer  bg-lightGrey text-darkGrey rounded-md px-2 py-1"
                      to={`/${option}`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </NavLink>
                  ) : (
                    <NavLink
                      key={index}
                      className="cursor-pointer hover:bg-midGrey rounded-md p-2"
                      to={`/${option}`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </NavLink>
                  ),
                )}
              </nav>
            </div>
          )}
          <div className="flex w-full">
            <Outlet />
          </div>
          <div className="w-[25%]  border-l-2  border-midGrey">
            <h1 className="text-lg text-lightGrey w-full px-4 pt-4">
              {" "}
              Top Experts{" "}
            </h1>
            <div className="p-2">
              <ProfileCard />
            </div>
            <h1 className="flex gap-2 text-lg text-lightGrey w-full px-4 pt-4 items-end">
              {" "}
              Trending Topics <TrendingIcon />{" "}
            </h1>
            <ul className="flex flex-wrap gap-2 text-xs rounded-md p-4 ">
              <li className="bg-lightGrey rounded-md p-1 px-2">Network</li>{" "}
              <li className="bg-lightGrey rounded-md p-1 px-2">
                Human Resources
              </li>{" "}
              <li className="bg-lightGrey rounded-md p-1 px-2">
                Infrastructure
              </li>
            </ul>
            <h1 className="flex gap-2 text-lg text-lightGrey w-full px-4 pt-4 items-end">
              {" "}
              Suggestions
            </h1>
          </div>
        </div>
      </div>
    </>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  if (!userId) {
    return redirect("login");
  }
  const userDetails = await getUserById(userId, { profile: true });

  return { userId, userDetails };
}
