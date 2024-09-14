import { MetaFunction } from "@remix-run/node";
import LatestTasks from "~/components/cards/LatestTasksCard";
import Navbar from "~/components/navigation/Header2";

export const meta: MetaFunction = () => {
  return [
    { title: "Skillanthropy" },
    { name: "description", content: "Welcome to Skillanthropy!" },
  ];
};

export default function Login() {
  return (
    <>
      <div className="bg-baseSecondary h-auto lg:h-screen max-w-full">
        <Navbar altBackground={true} />

        <div className="p-4"></div>
        <h1 className="tracking-wide text-accentPrimary w-fit text-4xl lg:text-7xl mt-8 m-auto">
          {" "}
          Donate your digital skills{" "}
        </h1>
        <h1 className="tracking-wide text-basePrimaryDark w-fit text-3xl m-auto lg:text-5xl ">
          {" "}
          Amplify Charity Impact{" "}
        </h1>
        <div className="flex flex-col h-fit lg:flex-row items-center justify-center p-4">
          <div className="flex-shrink-0 lg:w-1/2 ">
            <img
              src="/watering_plant.png"
              alt="water plant home page image"
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="flex-1 lg:w-1/2 w-full lg:max-w-xl mt-4 lg:mt-0 lg:ml-4">
            <LatestTasks />
          </div>
        </div>
      </div>
    </>
  );
}
