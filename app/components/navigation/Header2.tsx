import { Form, Link, useFetcher, useLocation, useNavigate } from "react-router";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { CaretDown, List, MagnifyingGlass, X } from "@phosphor-icons/react";
import { InboxNotifications } from "../InboxNotifications";
import { SimpleProfileCard } from "../cards/ProfileCard";
import { users } from "@prisma/client";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SearchDropdown } from "../utils/selectDropdown";
import { MultiSearchDocuments } from "~/types/tasks";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface NavbarProps {
  altBackground?: boolean;
  user: users | null;
  novuAppId: string | undefined;
}

interface SearchState {
  query: string;
}

interface NavigationLink {
  path: string;
  label: string;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const SEARCH_SCHEMA = z.object({
  query: z
    .string()
    .trim()
    .max(100, { message: "Search query cannot exceed 100 characters" }),
});

const NAV_LINKS: NavigationLink[] = [
  { path: "/explore/tasks", label: "Tasks" },
  { path: "/explore/charities", label: "Charities" },
];

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to manage navbar visibility based on scroll direction
 */
const useNavbarVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Hide when scrolling down
      } else {
        setIsVisible(true); // Show when scrolling up
      }

      setLastScrollY(currentScrollY);
    };

    const throttledHandler = throttle(handleScroll, 100);
    window.addEventListener("scroll", throttledHandler, { passive: true });

    return () => window.removeEventListener("scroll", throttledHandler);
  }, [lastScrollY]);

  return isVisible;
};

/**
 * Generic click outside hook for dropdowns and modals
 */
const useClickOutside = <T extends HTMLElement>(
  callback: () => void,
  enabled: boolean = true,
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [callback, enabled]);

  return ref;
};

/**
 * Hook to manage search functionality
 */
const useSearch = () => {
  const [search, setSearch] = useState<SearchState>({ query: "" });
  const [searchError, setSearchError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const fetcher = useFetcher();
  const navigate = useNavigate();

  // Handle search input changes
  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch({ query: value });
    setSearchError(null);
    setValidationError(null);

    if (value.trim()) {
      setIsSearchVisible(true);
    }
  }, []);

  // Validate search query
  const isValidSearch = useMemo(() => {
    try {
      SEARCH_SCHEMA.parse(search);
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
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (isValidSearch && search.query.trim()) {
        navigate({
          pathname: "/search",
          search: `?query=${encodeURIComponent(search.query.trim())}`,
        });
        setIsSearchVisible(false);
      }
    },
    [isValidSearch, search.query, navigate],
  );

  // Load search results
  useEffect(() => {
    if (search.query.trim()) {
      const timeoutId = setTimeout(() => {
        fetcher.load(`/api/search?search=${search.query}`);
      }, 300); // Debounce search requests

      return () => clearTimeout(timeoutId);
    }
  }, [search.query, fetcher]);

  // Handle search errors
  useEffect(() => {
    if (fetcher.data?.status === "error") {
      setSearchError(fetcher.data.message);
    }
  }, [fetcher.data]);

  // Hide search on outside click
  const searchRef = useClickOutside<HTMLDivElement>(
    () => setIsSearchVisible(false),
    isSearchVisible,
  );

  return {
    search,
    searchError,
    validationError,
    isSearchVisible,
    searchResults: fetcher.data?.rawSearchedDocuments,
    searchRef,
    handleSearchChange,
    handleSearchSubmit,
    setIsSearchVisible,
  };
};

/**
 * Hook to manage mobile sidebar state
 */
const useMobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useClickOutside<HTMLDivElement>(
    () => setIsOpen(false),
    isOpen,
  );

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    sidebarRef,
    toggleSidebar,
    closeSidebar,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Throttle function for performance optimization
 */
function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Logo component with consistent styling
 */
const Logo = ({ altBackground }: { altBackground?: boolean }) => (
  <Link
    to="/"
    className={`flex items-center gap-2 pl-4 font-semibold tracking-wide font-header transition-colors duration-200 hover:opacity-80 ${
      altBackground ? "text-accentPrimary" : "text-baseSecondary"
    }`}
    aria-label="Altruvist home"
  >
    <img src="/favicon.ico" alt="Altruvist Logo" className="w-8 h-8" />
    <span className="hidden sm:inline text-xl lg:text-2xl">Altruvist</span>
  </Link>
);

/**
 * Desktop navigation links
 */
const DesktopNavigation = ({ altBackground }: { altBackground?: boolean }) => {
  const location = useLocation();

  return (
    <nav className="hidden md:flex items-center gap-6" role="navigation">
      {NAV_LINKS.map(({ path, label }) => {
        const isActive = location.pathname === path;

        return !isActive ? (
          <Link
            key={path}
            to={path}
            className={`font-primary text-sm font-medium transition-all duration-200 hover:underline hover:underline-offset-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded-sm px-1 py-1 ${
              altBackground ? "text-accentPrimary" : "text-baseSecondary"
            }`}
          >
            {label}
          </Link>
        ) : null;
      })}
    </nav>
  );
};

/**
 * Search bar component with dropdown
 */
const SearchSection = ({
  search,
  searchError,
  validationError,
  searchResults,
  isSearchVisible,
  searchRef,
  onSearchChange,
  onSearchSubmit,
  onFocus,
}: {
  search: SearchState;
  searchError: string | null;
  validationError: string | null;
  searchResults: MultiSearchDocuments[] | undefined;
  isSearchVisible: boolean;
  searchRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onFocus: () => void;
}) => (
  <div className="flex-1 max-w-md mx-auto px-4 relative" ref={searchRef}>
    <Form
      className="relative flex items-center bg-basePrimaryLight rounded-lg shadow-sm border border-baseSecondary/10 focus-within:border-baseSecondary/30 transition-colors"
      onSubmit={onSearchSubmit}
      role="search"
    >
      <div className="flex items-center flex-grow">
        <MagnifyingGlass
          size={18}
          weight="regular"
          className="ml-3 text-baseSecondary/60"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder={
            searchError
              ? "Search is unavailable"
              : "Search tasks, charities, users..."
          }
          className={`w-full px-3 py-2.5 bg-transparent text-sm placeholder-baseSecondary/50 focus:outline-none ${
            searchError
              ? "cursor-not-allowed text-dangerPrimary"
              : "text-baseSecondary"
          }`}
          onChange={onSearchChange}
          onFocus={onFocus}
          value={search.query}
          disabled={!!searchError}
          aria-label="Search"
          autoComplete="off"
        />
      </div>
    </Form>

    {/* Validation Error */}
    {validationError && (
      <p className="text-dangerPrimary text-xs mt-1 px-1" role="alert">
        {validationError}
      </p>
    )}

    {/* Search Results Dropdown */}
    {isSearchVisible && (
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-md bg-basePrimaryDark rounded-lg shadow-xl border border-baseSecondary/20 z-50">
        {searchError ? (
          <div className="p-4 text-sm text-dangerPrimary" role="alert">
            {searchError}
          </div>
        ) : search.query.trim() ? (
          <SearchDropdown searchResults={searchResults || []} />
        ) : (
          <div className="p-4 text-sm text-baseSecondary/70">
            Start typing to search...
          </div>
        )}
      </div>
    )}
  </div>
);

/**
 * Desktop actions (notifications, wallet, auth)
 */
const DesktopActions = ({
  altBackground,
  user,
  novuAppId,
}: {
  altBackground?: boolean;
  user: users | null;
  novuAppId: string | undefined;
}) => {
  const notifications = useMemo(
    () =>
      user?.id ? (
        <InboxNotifications
          applicationIdentifier={novuAppId ?? ""}
          subscriberId={user.id}
        />
      ) : null,
    [user?.id, novuAppId],
  );

  return (
    <div className="hidden md:flex items-center gap-3">
      {/* Notifications */}
      <div className="hidden md:block">{notifications}</div>

      {/* Wallet */}
      <div className="hidden lg:block">
        <WalletMultiButton />
      </div>

      {/* Auth */}
      <AuthButton altBackground={altBackground} userId={user?.id} />
    </div>
  );
};

/**
 * Mobile menu toggle button
 */
const MobileMenuButton = ({
  altBackground,
  isOpen,
  onClick,
}: {
  altBackground?: boolean;
  isOpen: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="p-2 rounded-lg transition-colors duration-200 hover:bg-baseSecondary/10 focus:outline-none focus:ring-2 focus:ring-baseSecondary/50"
    aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
    aria-expanded={isOpen}
  >
    <List
      size={24}
      weight="bold"
      color={altBackground ? "#F5F5DC" : "#836953"}
    />
  </button>
);

/**
 * Mobile sidebar navigation
 */
const MobileSidebar = ({
  isOpen,
  onClose,
  user,
  novuAppId,
  sidebarRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: users | null;
  novuAppId: string | undefined;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const notifications = useMemo(
    () =>
      user?.id ? (
        <InboxNotifications
          applicationIdentifier={novuAppId ?? ""}
          subscriberId={user.id}
        />
      ) : null,
    [user?.id, novuAppId],
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed right-0 top-0 h-screen w-80 max-w-[85vw] bg-basePrimaryLight border-l border-baseSecondary/20 z-50 overflow-visible transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-baseSecondary/20">
          {/* Notifications in header */}
          {user?.id && (
            <div className="flex items-center gap-2">{notifications}</div>
          )}
          {/* User Profile */}
          {user && (
            <SimpleProfileCard
              name={user.name}
              userTitle={user.userTitle}
              profilePicture={user.profilePicture}
              id={user.id}
              className="hover:shadow-md transition-shadow duration-200"
            />
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-baseSecondary hover:bg-baseSecondary/10 hover:text-dangerPrimary transition-colors focus:outline-none focus:ring-2 focus:ring-baseSecondary/50"
            aria-label="Close menu"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <nav
          className="flex flex-col p-4 gap-2 overflow-y-auto z h-full "
          role="navigation"
        >
          <MobileNavigation user={user} />

          {/* Wallet Section */}
          <div className="mt-6 pt-4 border-t border-baseSecondary/20">
            <h3 className="text-sm font-medium text-baseSecondary/70 mb-3">
              Wallet
            </h3>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </div>

          {/* Auth Section */}
          <div className="mt-4">
            <AuthButton userId={user?.id} mobile />
          </div>
        </nav>
      </aside>
    </>
  );
};

/**
 * Mobile navigation content
 */
const MobileNavigation = ({ user }: { user: users | null }) => {
  const [exploreOpen, setExploreOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* Explore Section */}
      <div>
        <button
          onClick={() => setExploreOpen(!exploreOpen)}
          className="w-full flex items-center justify-between p-3 text-left rounded-lg text-baseSecondary hover:bg-baseSecondary/10 transition-colors"
          aria-expanded={exploreOpen}
        >
          <span className="font-medium">Explore</span>
          <CaretDown
            size={16}
            className={`transform transition-transform ${exploreOpen ? "rotate-180" : ""}`}
          />
        </button>

        {exploreOpen && (
          <div className="mt-2 ml-4 space-y-1">
            {NAV_LINKS.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className="block p-2 text-sm text-baseSecondary/80 hover:text-baseSecondary hover:bg-baseSecondary/5 rounded transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Dashboard Section (for logged in users) */}
      {user && (
        <div>
          <button
            onClick={() => setDashboardOpen(!dashboardOpen)}
            className="w-full flex items-center justify-between p-3 text-left rounded-lg text-baseSecondary hover:bg-baseSecondary/10 transition-colors"
            aria-expanded={dashboardOpen}
          >
            <span className="font-medium">Dashboard</span>
            <CaretDown
              size={16}
              className={`transform transition-transform ${dashboardOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dashboardOpen && (
            <div className="mt-2 ml-4 space-y-1">
              <Link
                to="/dashboard"
                className="block p-2 text-sm text-baseSecondary/80 hover:text-baseSecondary hover:bg-baseSecondary/5 rounded transition-colors"
              >
                Overview
              </Link>
              <Link
                to="/dashboard/tasks"
                className="block p-2 text-sm text-baseSecondary/80 hover:text-baseSecondary hover:bg-baseSecondary/5 rounded transition-colors"
              >
                Tasks
              </Link>
              <Link
                to="/dashboard/charities"
                className="block p-2 text-sm text-baseSecondary/80 hover:text-baseSecondary hover:bg-baseSecondary/5 rounded transition-colors"
              >
                Charities
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Settings & Logout for logged in users */}
      {user && (
        <div className="mt-6 pt-4 border-t border-baseSecondary/20 space-y-2">
          <Link
            to="/account/settings"
            className="block p-3 text-baseSecondary hover:bg-baseSecondary/10 rounded-lg transition-colors"
          >
            Settings
          </Link>
          <Link
            to="/zitlogout"
            className="block p-3 text-dangerPrimary hover:bg-dangerPrimary/10 rounded-lg transition-colors"
          >
            Logout
          </Link>
        </div>
      )}
    </div>
  );
};

/**
 * Authentication button (sign in/profile)
 */
const AuthButton = ({
  altBackground,
  userId,
  mobile = false,
}: {
  altBackground?: boolean;
  userId?: string;
  mobile?: boolean;
}) => {
  if (userId) return null; // User is logged in, no auth button needed

  return (
    <Link
      to="/zitlogin"
      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accentPrimary ${
        mobile
          ? "w-full bg-accentPrimary text-baseSecondary hover:bg-accentPrimary/90"
          : "bg-accentPrimary text-baseSecondary hover:bg-accentPrimary/90 hover:scale-105"
      } ${altBackground ? "ring-offset-baseSecondary" : "ring-offset-basePrimary"}`}
    >
      Sign In
    </Link>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Main navigation component with responsive design and accessibility
 */
export default function Header2({
  altBackground,
  user,
  novuAppId,
}: NavbarProps) {
  const isNavbarVisible = useNavbarVisibility();
  const {
    search,
    searchError,
    validationError,
    isSearchVisible,
    searchResults,
    searchRef,
    handleSearchChange,
    handleSearchSubmit,
    setIsSearchVisible,
  } = useSearch();

  const {
    isOpen: isMobileSidebarOpen,
    sidebarRef,
    toggleSidebar,
    closeSidebar,
  } = useMobileSidebar();

  const handleSearchFocus = useCallback(() => {
    setIsSearchVisible(true);
  }, [setIsSearchVisible]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${
        isNavbarVisible ? "translate-y-0" : "-translate-y-full"
      } ${altBackground ? "bg-baseSecondary" : "bg-basePrimary"} border-b border-baseSecondary/20 backdrop-blur-sm`}
      role="banner"
    >
      <div className="flex items-center justify-between h-16 px-4 gap-4 max-w-7xl mx-auto">
        {/* Left: Logo + Desktop Navigation */}
        <div className="flex items-center gap-6 min-w-0">
          <Logo altBackground={altBackground} />
          <DesktopNavigation altBackground={altBackground} />
        </div>

        {/* Center: Search */}
        <SearchSection
          search={search}
          searchError={searchError}
          validationError={validationError}
          searchResults={searchResults}
          isSearchVisible={isSearchVisible}
          searchRef={searchRef}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          onFocus={handleSearchFocus}
        />

        {/* Right: Desktop Actions + Mobile Menu */}
        <div className="flex items-center gap-3">
          <DesktopActions
            altBackground={altBackground}
            user={user}
            novuAppId={novuAppId}
          />

          <MobileMenuButton
            altBackground={altBackground}
            isOpen={isMobileSidebarOpen}
            onClick={toggleSidebar}
          />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={closeSidebar}
        user={user}
        novuAppId={novuAppId}
        sidebarRef={sidebarRef}
      />
    </header>
  );
}
