import { Form, Link } from "@remix-run/react";
import { SearchIcon } from "../utils/icons";
import { useEffect, useState } from "react";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";

export default function Navbar({
  altBackground,
  isLoggedIn,
}: {
  altBackground?: boolean;
  isLoggedIn: boolean;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollPos, setLastScrollPos] = useState(0);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;

      if (currentScrollPos > lastScrollPos) {
        // User is scrolling down
        setShowNavbar(false);
      } else {
        // User is scrolling up
        setShowNavbar(true);
      }

      setLastScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
    // when scroll position changes, toggle nabvar
  }, [lastScrollPos]);
  return (
    <>
      <div
        className={`fixed w-full transition-transform duration-300 ease-in-out z-50 ${
          showNavbar ? "transform translate-y-0" : "transform -translate-y-full"
        } border-b-[1px] border-b-baseSecondary h-fit ${altBackground && "bg-baseSecondary"}  bg-basePrimary`}
      >
        <div className="flex justify-between h-auto px-2 flex-row items-center gap-4">
          <Link
            to={"/"}
            className={`text-3xl lg:text-5xl ${altBackground ? "text-accentPrimary" : "text-baseSecondary"} tracking-wide  font-header `}
          >
            Skillanthropy
          </Link>
          <div className="w-fit lg:flex flex-row items-center gap-2 text-baseSecondary hidden">
            <NavListPages altBackground={altBackground} />
          </div>
          <Form className="w-full p-4" action="">
            <div className="flex items-center bg-basePrimaryDark lg:max-w-96 m-auto -ml-2 rounded-md">
              <div className="p-1 flex gap-4 items-center  flex-grow ">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search "
                  className="w-full flex-grow bg-basePrimaryDark  text-sm lg:text-base"
                />
              </div>
              {/* <div className="h-fit w-fit rounded-md px-2 mr-2 bg-basePrimaryLight text-baseSecondary text-[12px] lg:text-[13px]">
                /
              </div> */}
            </div>
          </Form>
          <button
            className="lg:hidden flex px-3 py-2 rounded"
            onClick={toggleDropdown}
          >
            <svg
              className="fill-current h-4 w-4 t "
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              fill={`${altBackground ? "#F5F5DC" : "#836953"}`}
            >
              <title>Menu</title>
              <path d="M0 3h20v2H0V3zm0 5h20v2H0V8zm0 5h20v2H0v-2z" />
            </svg>
          </button>
          <div className="w-fit min-w-fit lg:flex flex-row items-center gap-4 text-baseSecondary hidden">
            <NavListAuth
              altBackground={altBackground}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </div>

        <div
          className={`fixed right-0 h-screen w-64 transform transition-transform duration-300 ease-in-out ${
            isDropdownOpen ? "translate-x-0" : "translate-x-full"
          } lg:hidden bg-basePrimaryLight z-10 font-primary rounded-md`}
        >
          <div className="flex flex-col p-4 gap-2 text-baseSecondary">
            <NavListPages />
            <NavListAuth isLoggedIn />
          </div>

          <button
            className="absolute top-3 right-4 text-baseSecondary"
            onClick={toggleDropdown}
          >
            x
          </button>
        </div>
      </div>
    </>
  );
}

export const NavListPages = ({
  altBackground,
}: {
  altBackground?: boolean;
}) => {
  return (
    <>
      <Link
        className={`hover:border-b-2 border-b-baseSecondary pb-1 pl-2 ${altBackground && "text-accentPrimary"}`}
        to={"/explore"}
      >
        Explore
      </Link>
      <Link
        className={`hover:border-b-2 border-b-baseSecondary pb-1 pl-2 ${altBackground && "text-accentPrimary"}`}
        to={"/dashboard"}
      >
        Dashboard
      </Link>
    </>
  );
};

export const NavListAuth = ({
  altBackground,
  isLoggedIn,
}: {
  altBackground?: boolean;
  isLoggedIn: boolean;
}) => {
  return (
    <>
      {isLoggedIn ? (
        <>
          <Link
            to={"/account/settings"}
            className=" text-baseSecondary  rounded-md px-2 "
          >
            {" "}
            Profile
          </Link>
        </>
      ) : (
        <>
          <Link
            to={"/zitlogin"}
            className={`hover:border-b-2 border-b-baseSecondary pl-2 ${altBackground && "text-accentPrimary"}`}
          >
            Sign in
          </Link>
          <Link
            to={"/zitlogin"}
            className="bg-accentPrimary text-baseSecondary p-1 rounded-md px-3 "
          >
            Join
          </Link>
        </>
      )}
    </>
  );
};
