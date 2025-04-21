import { Link, useNavigate } from "@remix-run/react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
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
  const [prevScrollY, setPrevScrollY] = useState(0); // Track previous scroll position

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);
  const toggleResourcesMenu = () => setResourcesMenuOpen(!resourcesMenuOpen);
  const navigate = useNavigate();

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".resources-menu-container") && resourcesMenuOpen) {
        setResourcesMenuOpen(false);
      }
      if (!target.closest(".user-menu-container") && userMenuOpen) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [resourcesMenuOpen, userMenuOpen]);

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
              <Link
                to="/about"
                className={`px-4 py-2 rounded-lg transition-all font-medium hover:scale-105 active:scale-95 ${
                  isScrolled
                    ? "text-basePrimaryDark hover:text-accentPrimary"
                    : "text-accentPrimary hover:bg-baseSecondary/50"
                }`}
              >
                <span className="text-accentPrimary font-medium">About</span>
              </Link>

              <Link
                to="/explore"
                className={`px-4 py-2 rounded-lg transition-all font-medium hover:scale-105 active:scale-95 ${
                  isScrolled
                    ? "text-basePrimaryDark hover:text-accentPrimary"
                    : "text-accentPrimary hover:bg-baseSecondary/50"
                }`}
              >
                <span className="text-accentPrimary font-medium">Explore</span>
              </Link>

              {/* Resources Dropdown */}
              <div className="relative resources-menu-container">
                <motion.button
                  onClick={toggleResourcesMenu}
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
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Volunteer Guide
                      </Link>
                      <Link
                        to="/charity-resources"
                        className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                      >
                        Charity Resources
                      </Link>
                      <Link
                        to="/faq"
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
                      <div className="w-8 h-8 rounded-full bg-accentPrimary/20 flex items-center justify-center text-accentPrimary mx-2">
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
                            className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark " : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                          >
                            Profile
                          </Link>
                          <Link
                            to="/dashboard"
                            className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark " : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                          >
                            Dashboard
                          </Link>
                          <Link
                            to="/account/settings"
                            className={`block px-4 py-2 text-sm ${isScrolled ? "text-basePrimaryDark " : "text-accentPrimary hover:bg-baseSecondary/70"}`}
                          >
                            Settings
                          </Link>
                          <div
                            className={`border-t my-1 ${isScrolled ? "border-basePrimary" : "border-accentPrimary/20"}`}
                          ></div>
                          <Link
                            to="/zitlogout"
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
                <Link
                  to="/about"
                  className={`block px-4 py-2 rounded-lg transition-all font-medium hover:scale-105 active:scale-95 ${
                    isScrolled
                      ? "text-basePrimaryDark hover:text-accentPrimary"
                      : "text-accentPrimary hover:bg-baseSecondary/50"
                  }`}
                >
                  About
                </Link>
                <Link
                  to="/explore"
                  className={`block px-4 py-2 rounded-lg transition-all font-medium hover:scale-105 active:scale-95 ${
                    isScrolled
                      ? "text-basePrimaryDark hover:text-accentPrimary"
                      : "text-accentPrimary hover:bg-baseSecondary/50"
                  }`}
                >
                  Explore
                </Link>

                {/* Resources section for mobile */}
                <div className="mt-2">
                  <div
                    className={`px-4 py-2 font-medium ${
                      isScrolled ? "text-basePrimaryDark" : "text-accentPrimary"
                    }`}
                  >
                    Resources
                  </div>
                  <div className="pl-4 border-l-2 ml-4 border-accentPrimary/20 space-y-1 mt-1">
                    <Link
                      to="/volunteer-guide"
                      className={`block px-4 py-2 rounded-lg text-sm transition-all ${
                        isScrolled
                          ? "text-basePrimaryDark hover:text-accentPrimary"
                          : "text-accentPrimary hover:bg-baseSecondary/50"
                      }`}
                    >
                      Volunteer Guide
                    </Link>
                    <Link
                      to="/charity-resources"
                      className={`block px-4 py-2 rounded-lg text-sm transition-all ${
                        isScrolled
                          ? "text-basePrimaryDark hover:text-accentPrimary"
                          : "text-accentPrimary hover:bg-baseSecondary/50"
                      }`}
                    >
                      Charity Resources
                    </Link>
                    <Link
                      to="/faq"
                      className={`block px-4 py-2 rounded-lg text-sm transition-all ${
                        isScrolled
                          ? "text-basePrimaryDark hover:text-accentPrimary"
                          : "text-accentPrimary hover:bg-baseSecondary/50"
                      }`}
                    >
                      FAQ
                    </Link>
                  </div>
                </div>

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

                {/* Mobile login/signup or user menu */}
                {!userId ? (
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
                ) : (
                  // User profile menu for mobile
                  <div className="pt-2 space-y-1">
                    <div
                      className={`px-4 py-3 flex items-center space-x-3 ${
                        isScrolled
                          ? "bg-basePrimaryLight/50"
                          : "bg-baseSecondary/70"
                      } rounded-lg`}
                    >
                      <div className="w-10 h-10 rounded-full bg-accentPrimary/20 flex items-center justify-center">
                        {
                          <Avatar
                            name={userInfo?.name}
                            src={profilePicture || ""}
                          />
                        }
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${isScrolled ? "text-basePrimaryDark" : "text-accentPrimary"}`}
                        >
                          {userInfo?.name}
                        </p>
                        <p className="text-sm text-basePrimaryDark">
                          {userInfo?.email}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/profile/${userId}`}
                      className={`block px-4 py-3 rounded-lg ${
                        isScrolled
                          ? "text-basePrimaryDark "
                          : "text-accentPrimary hover:bg-baseSecondary/70"
                      }`}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className={`block px-4 py-3 rounded-lg ${
                        isScrolled
                          ? "text-basePrimaryDark "
                          : "text-accentPrimary hover:bg-baseSecondary/70"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/account/settings"
                      className={`block px-4 py-3 rounded-lg ${
                        isScrolled
                          ? "text-basePrimaryDark "
                          : "text-accentPrimary hover:bg-baseSecondary/70"
                      }`}
                    >
                      Settings
                    </Link>
                    <div
                      className={`border-t my-1 ${isScrolled ? "border-basePrimary" : "border-accentPrimary/20"}`}
                    ></div>
                    <Link
                      to="/zitlogout"
                      className={`flex items-center px-4 py-3 rounded-lg  w-fit  ${
                        isScrolled
                          ? "text-dangerPrimary "
                          : "text-dangerPrimary hover:bg-baseSecondary/50"
                      }`}
                    >
                      <SignOut size={20} className="mr-2" />
                      Sign out
                    </Link>
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
