import { Form, Link, useFetcher, useLocation, useNavigate } from "@remix-run/react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { SearchDropdown } from "../utils/selectDropdown";
import { z } from "zod";
import { List, MagnifyingGlass } from "phosphor-react";
import { InboxNotifications } from "../InboxNotifications";

export default function Navbar({
  altBackground,
  userId,
}: {
  altBackground?: boolean;
  userId: string | undefined;
  handleSearch?: (e: ChangeEvent<HTMLInputElement>, property: string) => void;
  searchValue?: {
    query: string;
  };
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

  const [search, setSearch] = useState({
    query: "",
  });
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [validationError, setValidationError] = useState<string | null>(null);
  const location = useLocation()

  // console.log(Boolean(searchError));

  function useClickOutside(initialIsVisible: boolean) {
    const [isVisible, setIsVisible] = useState(initialIsVisible);
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    useEffect(() => {
      // Add event listener when the component mounts
      document.addEventListener("mousedown", handleClickOutside);

      // Cleanup the event listener when the component unmounts
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return { ref, isVisible, setIsVisible };
  }

  const { ref, isVisible, setIsVisible } = useClickOutside(false);
  const handleSearch = (e: ChangeEvent<HTMLInputElement>, property: string) => {
    setSearch((preValue) => {
      return { ...preValue, [property]: e.target.value };
    });
    setSearchError(null);

    if (e.target.value) {
      setIsVisible(true);
    }
  };

  useEffect(() => {
    console.log(search);
    if (search.query) {
      fetcher.load(`/api/search?search=${search.query}`);
    }
  }, [search]);

  useEffect(() => {
    if (fetcher.data && fetcher.data.status === "error") {
      console.log(fetcher.data.message);

      setSearchError(fetcher.data.message);
    }
  }, [fetcher.data]);

  const searchValidation = useMemo(() => {
    const SearchSchema = z.object({
      query: z
        .string()
        .trim()
        .max(100, { message: "Search query cannot exceed 100 characters" }),
    });

    try {
      // Validate the search query
      SearchSchema.parse(search);
      setValidationError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set the first validation error message
        setValidationError(error.errors[0].message);
      }
      return false;
    }
  }, [search.query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before navigating
    if (searchValidation && search.query.trim()) {
      // Navigate with search query
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
          } border-b-[1px] border-b-baseSecondary h-fit ${altBackground && "bg-baseSecondary"}  bg-basePrimary`}
        ref={ref}
      >
        <div className="flex justify-between h-auto px-2 flex-row items-center gap-4">
          <Link
            to={"/"}
            className={`text-3xl   lg:text-4xl pl-4 font-semibold ${altBackground ? "text-accentPrimary" : "text-baseSecondary"} tracking-wide  font-header `}
          >
            <img
              src="/favicon.ico"
              alt="ZitHive Logo"
              className="" />
          </Link>

          <Link
            className={`p-2 px-4 hidden md:flex font-primary w-fit text-left transition-colors duration-200 hover:underline hover:underline-offset-8 ${altBackground ? "text-accentPrimary " : "text-baseSecondary"}`}
            to={"/explore"}
          >
            {location.pathname === "/explore" ? "" : "Explore"}
          </Link>
          <div className="w-full p-4 ">
            <Form
              className="flex items-center bg-basePrimaryDark lg:max-w-96 m-auto -ml-2 rounded-md"
              onSubmit={handleSearchSubmit}
            >
              <div className="p-1 flex gap-4 items-center flex-grow">
                <MagnifyingGlass size={20} weight="bold" color="#836953" />
                <input
                  type="text"
                  placeholder={`${searchError ? "Search is unavailable" : "Search"}`}
                  className={`w-full flex-grow bg-basePrimaryDark text-sm lg:text-base ${searchError && "cursor-not-allowed text-dangerPrimary"}`}
                  onChange={(e) => {
                    handleSearch(e, "query");
                  }}
                  name="query"
                  value={search.query}
                  onFocus={() => setIsVisible(true)} // Show dropdown on focus
                />
              </div>
            </Form>
            {validationError && (
              <p className="text-dangerPrimary text-sm">{validationError}</p>
            )}
            {/* Search Results or Error Handling */}

            <div className="z-10 mt-2 absolute w-96 bg-basePrimaryDark rounded ">
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

          {/* hamburger side menu button */}
          <InboxNotifications
            applicationIdentifier="rrCIU_4tFdsZ"
            subscriberId={userId ?? ""}

          />
          <button
            className=" flex px-3 py-2 rounded"
            onClick={toggleDropdown}
          >
            <List
              size={24}
              weight="bold"
              color={altBackground ? "#F5F5DC" : "#836953"}
            />
          </button>

          {/* sign in / join button on large screens */}
          <div className="w-fit min-w-fit lg:flex flex-row items-center gap-4 hidden md:block text-baseSecondary ">
            <NavListAuth altBackground={altBackground} userId={userId} />
          </div>
        </div>

        <div
          className={`fixed right-0 h-screen w-64 transform transition-transform duration-300 ease-in-out ${isDropdownOpen ? "translate-x-0" : "translate-x-full"
            }  bg-basePrimaryLight z-10 font-primary rounded-md`}
        >
          <nav className="flex flex-col p-4 gap-2 text-baseSecondary">
            <NavListPages userId={userId} />
            <NavListAuth userId={userId} />
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
}: {
  altBackground?: boolean;
  userId: string | undefined;
}) => {
  return (
    <>
      <Link
        className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200  ${altBackground && "text-accentPrimary"}`}
        to={"/explore"}
      >
        Explore
      </Link>
      {userId && (
        <>
          <Link
            className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200  ${altBackground && "text-accentPrimary"}`}
            to={"/dashboard"}
          >
            Dashboard
          </Link>
          <Link
            className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200  ${altBackground && "text-accentPrimary"}`}
            to={"/dashboard/tasks"}
          >
            Manage Tasks
          </Link>
          <Link
            className={`p-2 px-4 hover:bg-baseSecondary font-primary hover:text-basePrimary w-full text-left rounded-md transition-colors duration-200  ${altBackground && "text-accentPrimary"}`}
            to={`/profile/${userId}`}
          >
            Profile
          </Link>

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
            className={`p-2 px-2 md:px-4 bg-accentPrimary text-sm md:text-base text-baseSecondary font-primary  w-full text-left rounded-md transition-colors duration-200  ${altBackground && "text-accentPrimary"}`}
          >
            Sign in
          </Link>
        </>
      )}

    </>
  );
};
