import {
  Form,
  Link,
  useFetcher,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { SearchDropdown } from "../utils/selectDropdown";
import { z } from "zod";
import { List, MagnifyingGlass } from "@phosphor-icons/react";
import { InboxNotifications } from "../InboxNotifications";
import { SimpleProfileCard } from "../cards/ProfileCard";
import { users } from "@prisma/client";

export default function Navbar({
  altBackground,
  user,
  novuAppId,
}: {
  altBackground?: boolean;
  user: users | null;
  novuAppId: string | undefined;
  handleSearch?: (e: ChangeEvent<HTMLInputElement>, property: string) => void;
  searchValue?: {
    query: string;
  };
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollPos, setLastScrollPos] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState({ query: "" });
  const [searchError, setSearchError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close the dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDropdownOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle navbar showing/hiding based on scroll direction
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
  }, [lastScrollPos]);

  // Click outside handling for search dropdown
  function useClickOutside(initialIsVisible: boolean) {
    const [isVisible, setIsVisible] = useState(initialIsVisible);
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return { ref, isVisible, setIsVisible };
  }

  const { ref, isVisible, setIsVisible } = useClickOutside(false);

  // Handle search input changes
  const handleSearch = (e: ChangeEvent<HTMLInputElement>, property: string) => {
    setSearch((preValue) => {
      return { ...preValue, [property]: e.target.value };
    });
    setSearchError(null);

    if (e.target.value) {
      setIsVisible(true);
    }
  };

  // Load search results when search query changes
  useEffect(() => {
    if (search.query) {
      fetcher.load(`/api/search?search=${search.query}`);
    }
  }, [search]);

  // Handle search error
  useEffect(() => {
    if (fetcher.data && fetcher.data.status === "error") {
      setSearchError(fetcher.data.message);
    }
  }, [fetcher.data]);

  // Validate search query
  const searchValidation = useMemo(() => {
    const SearchSchema = z.object({
      query: z
        .string()
        .trim()
        .max(100, { message: "Search query cannot exceed 100 characters" }),
    });

    try {
      SearchSchema.parse(search);
      setValidationError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
      }
      return false;
    }
  }, [search.query]);

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchValidation && search.query.trim()) {
      navigate({
        pathname: "/search",
        search: `?query=${encodeURIComponent(search.query.trim())}`,
      });
    }
  };

  return (
    <>
      <div
        className={`fixed w-full transition-transform duration-300 ease-in-out z-50 ${showNavbar ? "transform translate-y-0" : "transform -translate-y-full"
          } border-b-[1px] border-b-baseSecondary h-fit ${altBackground && "bg-baseSecondary"
          } bg-basePrimary`}
        ref={ref}
      >
        <div className="flex justify-between h-auto px-2 flex-row items-center gap-4">
          {/* Logo */}
          <Link
            to={"/"}
            className={`text-3xl lg:text-4xl pl-4 font-semibold ${altBackground ? "text-accentPrimary" : "text-baseSecondary"
              } tracking-wide font-header`}
          >
            <img src="/favicon.ico" alt="Altruvist Logo" className="" />
          </Link>

          {/* Navigation links - desktop */}
          <div className="hidden mx-4 md:flex flex-row items-center gap-4">
            {location.pathname !== "/explore/tasks" && (
              <Link
                className={`hidden md:flex font-primary text-left transition-colors duration-200 hover:underline hover:underline-offset-8 whitespace-nowrap ${altBackground ? "text-accentPrimary" : "text-baseSecondary"
                  }`}
                to={"/explore/tasks"}
              >
                {"Tasks"}
              </Link>
            )}
            {location.pathname !== "/explore/charities" && (
              <Link
                className={`hidden md:flex font-primary text-left transition-colors duration-200 hover:underline hover:underline-offset-8 whitespace-nowrap ${altBackground ? "text-accentPrimary" : "text-baseSecondary"
                  }`}
                to={"/explore/charities"}
              >
                {"Charities"}
              </Link>
            )}
          </div>

          {/* Search bar */}
          <div className="w-full p-4">
            <Form
              className="flex items-center bg-basePrimaryLight lg:max-w-96 m-auto -ml-2 rounded-md"
              onSubmit={handleSearchSubmit}
            >
              <div className="p-1 flex gap-2 items-center flex-grow">
                <MagnifyingGlass
                  size={20}
                  weight="regular"
                  color="#836953"
                  className="ml-4"
                />
                <input
                  type="text"
                  placeholder={`${searchError ? "Search is unavailable" : "Search"}`}
                  className={`w-full flex-grow bg-basePrimaryLight text-sm lg:text-base ${searchError && "cursor-not-allowed text-dangerPrimary"
                    }`}
                  onChange={(e) => {
                    handleSearch(e, "query");
                  }}
                  name="query"
                  value={search.query}
                  onFocus={() => setIsVisible(true)}
                />
              </div>
            </Form>
            {validationError && (
              <p className="text-dangerPrimary text-sm">{validationError}</p>
            )}

            {/* Search Results Dropdown */}
            <div className="z-10 mt-2 absolute w-96 bg-basePrimaryDark rounded">
              {isVisible && (
                <div className="z-10 mt-2 absolute w-96 bg-basePrimaryDark rounded -ml-2">
                  {searchError && (
                    <div className="p-4 text-sm">{searchError}</div>
                  )}
                  {!searchError && search.query && (
                    <SearchDropdown
                      searchResults={fetcher.data?.rawSearchedDocuments}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notifications and hamburger menu */}
          <InboxNotifications
            applicationIdentifier={novuAppId ?? ""}
            subscriberId={user?.id ?? ""}
          />
          <button className="flex px-3 py-2 rounded" onClick={toggleDropdown}>
            <List
              size={24}
              weight="bold"
              color={altBackground ? "#F5F5DC" : "#836953"}
            />
          </button>

          {/* Auth buttons for large screens */}
          <div className="w-fit min-w-fit lg:flex flex-row items-center gap-4 hidden md:block text-baseSecondary">
            <NavListAuth altBackground={altBackground} userId={user?.id} />
          </div>
        </div>

        {/* Sidebar for mobile/tablet */}
        <div
          className={`fixed right-0 h-screen w-64 transform transition-transform duration-300 ease-in-out ${isDropdownOpen ? "translate-x-0" : "translate-x-full"
            } bg-basePrimaryLight z-10 font-primary rounded-md`}
          ref={sidebarRef}
        >
          <nav className="flex flex-col p-4 gap-2 text-baseSecondary">
            <NavListPages userId={user?.id} user={user} />
            <NavListAuth userId={user?.id} />
          </nav>

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
  userId,
  user,
}: {
  altBackground?: boolean;
  userId: string | undefined;
  user?: users | null;
}) => {
  const [exploreDropdown, setExploreDropdown] = useState(false);
  const [dashboardDropdown, setDashboardDropdown] = useState(false);

  const toggleExploreDropdown = () => {
    setExploreDropdown(!exploreDropdown);
  };

  const toggleDashboardDropdown = () => {
    setDashboardDropdown(!dashboardDropdown);
  };

  return (
    <>
      <div>
        {user && (
          <div className=" mb-4">
            <SimpleProfileCard
              name={user.name}
              userTitle={user.userTitle}
              profilePicture={user.profilePicture}
              className="hover:shadow-md transition-shadow duration-200"
              id={user.id}
            />
          </div>
        )}
      </div>

      <button
        className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200 ${altBackground && "text-accentPrimary"
          }`}
        onClick={toggleExploreDropdown}
      >
        Explore
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${exploreDropdown ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="flex flex-col gap-2 pl-4 py-1">
          <Link
            className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200 ${altBackground && "text-accentPrimary"
              }`}
            to={"/explore/tasks"}
          >
            Tasks
          </Link>
          <Link
            className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200 ${altBackground && "text-accentPrimary"
              }`}
            to={"/explore/charities"}
          >
            Charities
          </Link>
        </div>
      </div>
      {userId && (
        <>
          <button
            className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200 ${altBackground && "text-accentPrimary"
              }`}
            onClick={toggleDashboardDropdown}
          >
            Dashboard
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${dashboardDropdown ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="flex flex-col gap-2 pl-4 py-1">
              <Link
                className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200 ${altBackground && "text-accentPrimary"
                  }`}
                to={"/dashboard/tasks"}
              >
                Tasks
              </Link>
              <Link
                className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200 ${altBackground && "text-accentPrimary"
                  }`}
                to={"/dashboard/charities"}
              >
                Charities
              </Link>
              <Link
                className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200 ${altBackground && "text-accentPrimary"
                  }`}
                to={"/dashboard"}
              >
                Overview
              </Link>
            </div>
          </div>


          <div className="mt-4 pt-4 border-t border-baseSecondary/20">
            <Link
              to="/account/settings"
              className="p-2 px-4 hover:bg-baseSecondary hover:text-basePrimary text-baseSecondary w-full text-left rounded-md transition-colors duration-200 block font-primary"
            >
              Settings
            </Link>
            <Link
              to="/zitlogout"
              className="p-2 px-4 hover:bg-dangerPrimary hover:text-basePrimary text-baseSecondary w-full text-left rounded-md transition-colors duration-200 block font-primary"
            >
              Logout
            </Link>
          </div>
        </>
      )}
    </>
  );
};

export const NavListAuth = ({
  altBackground,
  userId,
}: {
  altBackground?: boolean;
  userId: string | undefined;
}) => {
  return (
    <>
      {!userId && (
        <>
          <Link
            to={"/zitlogin"}
            className={`p-2 px-4 md:px-4 text-base bg-accentPrimary  md:text-base text-baseSecondary font-primary w-full text-left rounded-md transition-colors duration-200 ${altBackground && "text-accentPrimary"
              }`}
          >
            Sign in
          </Link>
        </>
      )}
    </>
  );
};
