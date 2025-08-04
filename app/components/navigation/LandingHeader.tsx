import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { List, X, SignOut, CaretDown } from "@phosphor-icons/react";
import { users } from "@prisma/client";
import { Avatar } from "../cards/ProfileCard";

interface LandingHeaderProps {
  userId?: string | null;
  userInfo?: users;
  profilePicture?: string;
}

export default function LandingHeader({
  userId,
  userInfo,
  profilePicture,
}: LandingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [resourcesMenuOpen, setResourcesMenuOpen] = useState(false);
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
  const [prevScrollY, setPrevScrollY] = useState(0); // Track previous scroll position

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);
  const toggleResourcesMenu = () => setResourcesMenuOpen(!resourcesMenuOpen);
  const toggleAboutMenu = () => setAboutMenuOpen(!aboutMenuOpen);
  const toggleExploreMenu = () => setExploreMenuOpen(!exploreMenuOpen);
  const navigate = useNavigate();

  // Refs for dropdown buttons and dropdowns
  const userDropdownBtnRef = useRef<HTMLButtonElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const resourcesDropdownBtnRef = useRef<HTMLButtonElement>(null);
  const resourcesDropdownRef = useRef<HTMLDivElement>(null);
  const aboutDropdownBtnRef = useRef<HTMLButtonElement>(null);
  const aboutDropdownRef = useRef<HTMLDivElement>(null);
  const exploreDropdownBtnRef = useRef<HTMLButtonElement>(null);
  const exploreDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // User dropdown
      if (
        userMenuOpen &&
        !userDropdownRef.current?.contains(target) &&
        !userDropdownBtnRef.current?.contains(target)
      ) {
        setUserMenuOpen(false);
      }
      // Resources dropdown
      if (
        resourcesMenuOpen &&
        !resourcesDropdownRef.current?.contains(target) &&
        !resourcesDropdownBtnRef.current?.contains(target)
      ) {
        setResourcesMenuOpen(false);
      }
      // About dropdown
      if (
        aboutMenuOpen &&
        !aboutDropdownRef.current?.contains(target) &&
        !aboutDropdownBtnRef.current?.contains(target)
      ) {
        setAboutMenuOpen(false);
      }
      // Explore dropdown
      if (
        exploreMenuOpen &&
        !exploreDropdownRef.current?.contains(target) &&
        !exploreDropdownBtnRef.current?.contains(target)
      ) {
        setExploreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen, resourcesMenuOpen, aboutMenuOpen, exploreMenuOpen]);

  // Handle scroll effect with direction detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Detect scroll direction
      if (currentScrollY < prevScrollY) {
        // Scrolling up
        setIsScrolled(false);
      } else if (currentScrollY > prevScrollY) {
        // Scrolling down
        setIsScrolled(true);
      }

      // Update previous scroll position
      setPrevScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [prevScrollY]); // Include prevScrollY in the dependency array

  return (
    <motion.header
      className={`fixed w-full z-50 py-4 transition-all duration-300 ${isScrolled ? "py-2" : "py-4"}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-6">
        <div
          className={`backdrop-blur-md rounded-2xl shadow-lg border transition-all duration-300 ${
            isScrolled
              ? "border-basePrimary p-2"
              : "border-accentPrimary bg-baseSecondary/80 p-4"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-1 rounded-lg shadow-md"
              >
                <div
                  className={`rounded-md p-1.5 ${isScrolled ? "bg-baseSecondary/20" : "bg-baseSecondary"}`}
                >
                  <img
                    src="/favicon.ico"
                    alt="Altruvist"
                    className="h-8 w-auto"
                  />
                </div>
              </motion.div>
              <span
                className={`ml-3 text-xl font-bold ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary"}`}
              >
                Altruvist
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {/* About Dropdown */}
              <div className="relative about-menu-container">
                <motion.button
                  ref={aboutDropdownBtnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAboutMenu();
                  }}
                  className={`px-4 py-2 rounded-lg transition-all font-medium hover:scale-105 active:scale-95 flex items-center gap-1 ${
                    isScrolled
                      ? "text-basePrimaryDark hover:text-accentPrimary"
                      : "text-accentPrimary hover:bg-baseSecondary/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="text-accentPrimary font-medium">About</span>
                  <CaretDown
                    size={16}
                    className={`transition-transform ${aboutMenuOpen ? "rotate-180" : ""} ${
                      isScrolled ? "text-basePrimaryDark" : "text-accentPrimary"
                    }`}
                    style={{ marginTop: 2 }} // slight vertical alignment tweak
                  />
                </motion.button>
                {aboutMenuOpen && (
                  <motion.div
                    ref={aboutDropdownRef}
                    className={`absolute left-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden border z-50 ${
                      isScrolled
                        ? "border-basePrimary"
                        : "bg-baseSecondary border-accentPrimary/30"
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="py-1 bg-baseSecondary/90">
                      <Link
                        to="/about"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        About Altruvist
                      </Link>
                      <Link
                        to="/blockchain"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Blockchain
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Explore Dropdown */}
              <div className="relative">
                <motion.button
                  ref={exploreDropdownBtnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExploreMenu();
                  }}
                  className={`px-4 py-2 rounded-lg transition-all font-medium hover:scale-105 active:scale-95 flex items-center gap-1 ${
                    isScrolled
                      ? "text-basePrimaryDark hover:text-accentPrimary"
                      : "text-accentPrimary hover:bg-baseSecondary/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="text-accentPrimary font-medium">
                    Explore
                  </span>
                  <CaretDown
                    size={16}
                    className={`transition-transform ${exploreMenuOpen ? "rotate-180" : ""} ${
                      isScrolled ? "text-basePrimaryDark" : "text-accentPrimary"
                    }`}
                    style={{ marginTop: 2 }}
                  />
                </motion.button>
                {exploreMenuOpen && (
                  <motion.div
                    ref={exploreDropdownRef}
                    className={`absolute left-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden border z-50 ${
                      isScrolled
                        ? "border-basePrimary"
                        : "bg-baseSecondary border-accentPrimary/30"
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="py-1 bg-baseSecondary/90">
                      <Link
                        to="/explore/tasks"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Tasks
                      </Link>
                      <Link
                        to="/explore/charities"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Charities
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Resources Dropdown */}
              <div className="relative resources-menu-container">
                <motion.button
                  ref={resourcesDropdownBtnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleResourcesMenu();
                  }}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-all font-medium hover:scale-105 active:scale-95 ${
                    isScrolled
                      ? "text-basePrimaryDark hover:text-accentPrimary"
                      : "text-accentPrimary hover:bg-baseSecondary/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="text-accentPrimary font-medium">
                    Resources
                  </span>
                  <CaretDown
                    size={16}
                    className={`transition-transform ${resourcesMenuOpen ? "rotate-180" : ""} ${
                      isScrolled ? "text-basePrimaryDark" : "text-accentPrimary"
                    }`}
                  />
                </motion.button>

                {/* Resources dropdown menu */}
                {resourcesMenuOpen && (
                  <motion.div
                    ref={resourcesDropdownRef}
                    className={`absolute left-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden border ${
                      isScrolled
                        ? "border-basePrimary"
                        : "bg-baseSecondary border-accentPrimary/30"
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="py-1 bg-baseSecondary/90">
                      <Link
                        to="/volunteer-guide"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Volunteer Guide
                      </Link>
                      <Link
                        to="/charity-resources"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Charity Resources
                      </Link>
                      <Link
                        to="/faq"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        FAQ
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Conditional rendering based on login status */}
              {!userId ? (
                // User is not logged in
                <div className="ml-4 flex space-x-2">
                  <motion.button
                    className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                      isScrolled
                        ? "border-accentPrimary text-accentPrimary hover:bg-accentPrimary "
                        : "border-accentPrimary text-accentPrimary hover:bg-accentPrimary hover:text-baseSecondary"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/zitlogin")}
                  >
                    Login
                  </motion.button>
                </div>
              ) : (
                // User is logged in
                <div className="ml-4 flex items-center space-x-3">
                  {/* Notifications */}
                  {/* User menu dropdown */}
                  <div className="relative user-menu-container">
                    <motion.button
                      onClick={toggleUserMenu}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                        isScrolled ? "" : "hover:bg-baseSecondary/70"
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="w-8 h-8 mr-6 rounded-full bg-accentPrimary/20 flex items-center justify-center text-accentPrimary mx-2">
                        {
                          <Avatar
                            name={userInfo?.name}
                            src={profilePicture || ""}
                          />
                        }
                      </div>
                      <span
                        className={`font-medium ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary"}`}
                      >
                        {userInfo?.name}
                      </span>
                      <CaretDown
                        size={16}
                        className={
                          isScrolled
                            ? "text-basePrimaryDark"
                            : "text-accentPrimary"
                        }
                      />
                    </motion.button>

                    {/* User dropdown menu */}
                    {userMenuOpen && (
                      <motion.div
                        ref={userDropdownRef}
                        className={`absolute right-0 mt-2 w-48  rounded-lg shadow-lg overflow-hidden border ${
                          isScrolled
                            ? " border-basePrimary"
                            : "bg-baseSecondary border-accentPrimary/30"
                        }`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="py-1 bg-baseSecondary/90">
                          <Link
                            to={`/profile/${userId}`}
                            onClick={(e) => e.stopPropagation()}
                            className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark " : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                          >
                            Profile
                          </Link>
                          <Link
                            to="/dashboard"
                            onClick={(e) => e.stopPropagation()}
                            className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark " : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                          >
                            Dashboard
                          </Link>
                          <Link
                            to="/account/settings"
                            onClick={(e) => e.stopPropagation()}
                            className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark " : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                          >
                            Settings
                          </Link>
                          <div
                            className={`border-t my-1 ${isScrolled ? "border-basePrimary" : "border-accentPrimary/20"}`}
                          ></div>
                          <Link
                            to="/zitlogout"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex items-center px-4 py-2 text-sm ${isScrolled ? "text-dangerPrimary " : "text-dangerPrimary hover:bg-baseSecondary/70"}`}
                          >
                            <SignOut size={16} className="mr-2" />
                            Sign out
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden ">
              <motion.button
                onClick={toggleMenu}
                className={`p-2 rounded-lg ${
                  isScrolled
                    ? "bg-basePrimaryLight/80 text-basePrimaryDark hover:bg-basePrimary border-basePrimary"
                    : "bg-baseSecondary/50 text-accentPrimary hover:bg-accentPrimary/10"
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {isMenuOpen ? (
                  <X size={24} weight="bold" />
                ) : (
                  <List size={24} weight="bold" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              className={`md:hidden mt-4 rounded-xl overflow-hidden shadow-inner border-t ${
                isScrolled
                  ? " border-basePrimary"
                  : "bg-baseSecondary border-accentPrimary/30"
              }`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-2 py-3 space-y-1 bg-baseSecondary/90">
                {/* Profile Card Dropdown at Top */}
                {userId && (
                  <div className="mb-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserMenuOpen((open) => !open);
                      }}
                      className={`w-full px-4 py-3 flex items-center space-x-3 rounded-lg ${
                        isScrolled
                          ? "bg-basePrimaryLight/50"
                          : "bg-baseSecondary/70"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-accentPrimary/20 flex items-center justify-center">
                        <Avatar
                          name={userInfo?.name}
                          src={profilePicture || ""}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p
                          className={`font-medium ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary"}`}
                        >
                          {userInfo?.name}
                        </p>
                        <p className="text-sm text-basePrimaryDark">
                          {userInfo?.email}
                        </p>
                      </div>
                      <CaretDown
                        size={20}
                        className={
                          isScrolled
                            ? "text-basePrimaryDark"
                            : "text-accentPrimary"
                        }
                      />
                    </motion.button>
                    {userMenuOpen && (
                      <motion.div
                        ref={userDropdownRef}
                        className={`mt-1 rounded-lg shadow-lg overflow-hidden border ${isScrolled ? "border-basePrimary" : "bg-baseSecondary border-accentPrimary/30"}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Link
                          to={`/profile/${userId}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`block px-4 py-3 ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                        >
                          Profile
                        </Link>
                        <Link
                          to="/dashboard"
                          onClick={(e) => e.stopPropagation()}
                          className={`block px-4 py-3 ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/account/settings"
                          onClick={(e) => e.stopPropagation()}
                          className={`block px-4 py-3 ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                        >
                          Settings
                        </Link>
                        <div
                          className={`border-t my-1 ${isScrolled ? "border-basePrimary" : "border-accentPrimary/20"}`}
                        ></div>
                        <Link
                          to="/zitlogout"
                          onClick={(e) => e.stopPropagation()}
                          className={`flex items-center px-4 py-3 w-fit ${isScrolled ? "text-dangerPrimary" : "text-dangerPrimary hover:bg-baseSecondary/50"}`}
                        >
                          <SignOut size={20} className="mr-2" />
                          Sign out
                        </Link>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Home Link */}
                <Link
                  to="/"
                  className={`block px-4 py-2 rounded-lg transition-all font-medium hover:scale-105 active:scale-95 ${
                    isScrolled
                      ? "text-basePrimaryDark hover:text-accentPrimary"
                      : "text-accentPrimary hover:bg-baseSecondary/50"
                  }`}
                >
                  Home
                </Link>

                {/* About Dropdown */}
                <div className="relative">
                  <motion.button
                    ref={aboutDropdownBtnRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAboutMenuOpen((open) => !open);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 ${
                      isScrolled
                        ? "text-basePrimaryDark hover:text-accentPrimary"
                        : "text-accentPrimary hover:bg-baseSecondary/50"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>About</span>
                    <CaretDown
                      size={16}
                      className={aboutMenuOpen ? "rotate-180" : ""}
                    />
                  </motion.button>
                  {aboutMenuOpen && (
                    <motion.div
                      ref={aboutDropdownRef}
                      className={`mt-1 rounded-lg shadow-lg overflow-hidden border ${isScrolled ? "border-basePrimary" : "bg-baseSecondary border-accentPrimary/30"}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Link
                        to="/about"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        About Altruvist
                      </Link>
                      <Link
                        to="/blockchain"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Blockchain
                      </Link>
                    </motion.div>
                  )}
                </div>

                {/* Explore Dropdown */}
                <div className="relative">
                  <motion.button
                    ref={exploreDropdownBtnRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExploreMenuOpen((open) => !open);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 ${
                      isScrolled
                        ? "text-basePrimaryDark hover:text-accentPrimary"
                        : "text-accentPrimary hover:bg-baseSecondary/50"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Explore</span>
                    <CaretDown
                      size={16}
                      className={exploreMenuOpen ? "rotate-180" : ""}
                    />
                  </motion.button>
                  {exploreMenuOpen && (
                    <motion.div
                      ref={exploreDropdownRef}
                      className={`mt-1 rounded-lg shadow-lg overflow-hidden border ${isScrolled ? "border-basePrimary" : "bg-baseSecondary border-accentPrimary/30"}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Link
                        to="/explore/tasks"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Tasks
                      </Link>
                      <Link
                        to="/explore/charities"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Charities
                      </Link>
                    </motion.div>
                  )}
                </div>

                {/* Resources Dropdown */}
                <div className="relative">
                  <motion.button
                    ref={resourcesDropdownBtnRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setResourcesMenuOpen((open) => !open);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 ${
                      isScrolled
                        ? "text-basePrimaryDark hover:text-accentPrimary"
                        : "text-accentPrimary hover:bg-baseSecondary/50"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Resources</span>
                    <CaretDown
                      size={16}
                      className={resourcesMenuOpen ? "rotate-180" : ""}
                    />
                  </motion.button>
                  {resourcesMenuOpen && (
                    <motion.div
                      ref={resourcesDropdownRef}
                      className={`mt-1 rounded-lg shadow-lg overflow-hidden border ${isScrolled ? "border-basePrimary" : "bg-baseSecondary border-accentPrimary/30"}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Link
                        to="/volunteer-guide"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Volunteer Guide
                      </Link>
                      <Link
                        to="/charity-resources"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Charity Resources
                      </Link>
                      <Link
                        to="/faq"
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        FAQ
                      </Link>
                    </motion.div>
                  )}
                </div>

                {/* Contact Link */}
                <Link
                  to="/contact"
                  className={`block px-4 py-2 rounded-lg transition-all font-medium hover:scale-105 active:scale-95 ${
                    isScrolled
                      ? "text-basePrimaryDark hover:text-accentPrimary"
                      : "text-accentPrimary hover:bg-baseSecondary/50"
                  }`}
                >
                  Contact
                </Link>

                {/* Mobile login button if not logged in */}
                {!userId && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <motion.button
                      className={`px-4 py-3 rounded-lg border font-medium ${
                        isScrolled
                          ? "border-accentPrimary text-accentPrimary hover:bg-accentPrimary/10"
                          : "border-accentPrimary text-accentPrimary hover:bg-accentPrimary/20"
                      }`}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate("/zitlogin")}
                    >
                      Login
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
