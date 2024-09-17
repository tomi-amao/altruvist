import {
  Link,
  Outlet,
  useLocation,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import {
  BannerItem,
  DashboardBanner,
} from "~/components/cards/BannerSummaryCard";
import { ProfileCard } from "~/components/cards/ProfileCard";
import Navbar from "~/components/navigation/Header2";

export function loader() {
  return {};
}
export default function Dashboard() {
  const sideBarMenu = ["Dashboard", "Tasks", "Messages", "Feeds", "Explore"];
  const params = useSearchParams();
  const navigation = useNavigation();
  const location = useLocation();
  console.log(location.pathname);

  const bannerItems: BannerItem[] = [
    {
      title: "Recommended Tasks",
      value: "Create a Fundraising Platform for Charity X",
    },
    { title: "Charities Helped", value: "8" },
  ];

  const getLink = (link: string) => {
    switch (link) {
      case "Dashboard":
      case "Explore":
        return `/${link.toLowerCase()}`;
      default:
        return `/dashboard/${link.toLowerCase()}`;
    }
  };
  return (
    <>
      <div className=" h-auto lg:h-screen flex flex-row  ">
        <Navbar />
        <div className=" flex w-3/12 lg:max-w-48 space-y-4 mt-[3.8rem] lg:mt-[4rem] p-4  border-r-[1px] border-baseSecondary min-h-screen">
          <div>
            <ProfileCard />
            <nav>
              <ul className=" flex flex-col h-screen gap-1 ">
                {sideBarMenu.map((link, index) => (
                  <Link
                    to={getLink(link)}
                    key={index}
                    className={`p-2 px-4  hover:bg-baseSecondary   font-primary hover:text-basePrimary w-full text-left rounded-md ${location.pathname === `/dashboard/${link.toLowerCase()}` || location.pathname === `/${link.toLowerCase()}` ? "bg-baseSecondary text-basePrimary" : "text-baseSecondary"}`}
                  >
                    {link}
                  </Link>
                ))}
              </ul>
            </nav>
          </div>
        </div>
        <div className="w-full">
          <div className="mt-[3.8rem] lg:mt-[4rem] p-4 m-auto ">
            <div className="m-auto  ">
              {location.pathname === "/dashboard" && (
                <DashboardBanner
                  date={new Date().toDateString()}
                  bannerItems={bannerItems}
                />
              )}
            </div>
          </div>
          <Outlet></Outlet>
        </div>
      </div>
    </>
  );
}
