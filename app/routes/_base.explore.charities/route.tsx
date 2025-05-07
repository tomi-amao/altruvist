import { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { useState, useEffect } from "react";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import { listCharities } from "~/models/charities.server";
import { getFeatureFlags } from "~/services/env.server";
import { getSignedUrlForFile } from "~/services/s3.server";
import JoinCharityModal from "~/components/cards/JoinCharityModal";
import { Dropdown } from "~/components/utils/selectDropdown";
import {
  Buildings,
  MagnifyingGlass,
  X,
  TagSimple,
  Globe,
} from "@phosphor-icons/react";
import { getTags } from "~/constants/dropdownOptions";
import { charities as Charity } from "@prisma/client";
// Extended charity type with signed background picture
// Making nullable properties compatible with the loader data
interface ExtendedCharity
  extends Omit<
    Charity,
    | "website"
    | "contactPerson"
    | "contactEmail"
    | "backgroundPicture"
    | "createdAt"
    | "updatedAt"
  > {
  website: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  backgroundPicture: string | null;
  signedBackgroundPicture?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const meta = () => {
  return [{ title: "Explore Charities | Altruvist" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  // Check if user is logged in
  const { userInfo, charityMemberships } = await getUserInfo(accessToken || "");

  // Get list of all charities
  const { charities } = await listCharities();

  // Get feature flags
  const { FEATURE_FLAG } = getFeatureFlags();

  // Get signed URLs for charity profile images if they exist
  const charitiesWithSignedUrls = await Promise.all(
    (charities || []).map(async (charity) => {
      const backgroundPicture = charity.backgroundPicture || "";

      const signedBackgroundPicture = backgroundPicture
        ? await getSignedUrlForFile(backgroundPicture, true)
        : null;

      return {
        ...charity,
        signedBackgroundPicture,
      };
    }),
  );

  return {
    userInfo,
    charities: charitiesWithSignedUrls,
    charityMemberships,
    FEATURE_FLAG,
  };
}

export default function ExploreCharities() {
  const { userInfo, charities, charityMemberships } =
    useLoaderData<typeof loader>();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filteredCharities, setFilteredCharities] = useState<ExtendedCharity[]>(
    charities as ExtendedCharity[],
  );
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedCharity, setSelectedCharity] =
    useState<ExtendedCharity | null>(null);
  const [dropdownActive, setDropdownActive] = useState(false); // Add state for dropdown toggle
  const availableCategories = getTags("charityCategories");

  // Filter charities when search term or categories change
  useEffect(() => {
    let result = charities || [];

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (charity) =>
          charity.name.toLowerCase().includes(lowerSearchTerm) ||
          (charity.description &&
            charity.description.toLowerCase().includes(lowerSearchTerm)),
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      result = result.filter((charity) =>
        charity.tags.some((tag: string) => selectedCategories.includes(tag)),
      );
    }

    setFilteredCharities(result as ExtendedCharity[]);
  }, [searchTerm, selectedCategories, charities]);

  // Handle category selection from dropdown
  const handleCategorySelection = (option: string, selected: boolean) => {
    if (selected) {
      setSelectedCategories((prev) => [...prev, option]);
    } else {
      setSelectedCategories((prev) =>
        prev.filter((category) => category !== option),
      );
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
  };

  // Handle join charity button click
  const handleJoinCharity = (charity: ExtendedCharity) => {
    setSelectedCharity(charity);
    setShowJoinModal(true);
  };

  // Check if user is already a member of a charity
  const isUserMember = (charityId: string) => {
    return charityMemberships?.memberships?.some(
      (membership) => membership.charityId === charityId,
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-baseSecondary mb-2">
          Explore Charities
        </h1>
        <p className="text-baseSecondary/70">
          Discover and join charities that align with your skills and interests.
        </p>
      </div>
      {/* Search and filter section */}
      <div className="bg-basePrimaryLight rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlass size={20} className="text-baseSecondary/50" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-baseSecondary/20 rounded-lg bg-basePrimaryLight text-baseSecondary placeholder-baseSecondary/50 focus:outline-none focus:ring-2 focus:ring-baseSecondary/30"
              placeholder="Search charities by name or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X size={16} className="text-baseSecondary/50" />
              </button>
            )}
          </div>

          {/* Category filter dropdown with search */}
          <div className="relative -mt-1">
            <Dropdown
              options={availableCategories}
              placeholder="Filter by category"
              onSelect={handleCategorySelection}
              multipleSelect={true}
              defaultSelected={selectedCategories}
              showSearch={true}
              isActive={dropdownActive}
              onDropdownToggle={() => setDropdownActive(!dropdownActive)}
            />
          </div>
        </div>

        {/* Active filters */}
        {selectedCategories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-baseSecondary/10 text-baseSecondary"
              >
                {category}
                <button
                  onClick={() => handleCategorySelection(category, false)}
                  className="ml-1.5 text-baseSecondary/70 hover:text-baseSecondary"
                  aria-label={`Remove ${category} filter`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-baseSecondary/5 text-baseSecondary/70 hover:bg-baseSecondary/10 hover:text-baseSecondary"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
      {/* Results section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCharities.length > 0 ? (
          filteredCharities.map((charity: ExtendedCharity) => (
            <div
              key={charity.id}
              className="bg-basePrimaryLight rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-32 bg-gradient-to-r from-baseSecondary/60 to-baseSecondary/80 flex items-center justify-center relative">
                {charity.backgroundPicture ? (
                  <img
                    src={
                      charity.signedBackgroundPicture ||
                      charity.backgroundPicture
                    }
                    alt={`${charity.name} background`}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                ) : (
                  <Buildings size={48} className="text-basePrimary/90" />
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-baseSecondary mb-2">
                  {charity.name}
                </h2>
                {charity.description && (
                  <p className="text-baseSecondary/70 mb-4 line-clamp-3">
                    {charity.description}
                  </p>
                )}

                {/* Charity tags */}
                {charity.tags && charity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {charity.tags
                      .slice(0, 3)
                      .map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-baseSecondary/10 text-baseSecondary"
                        >
                          <TagSimple size={12} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                    {charity.tags.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-baseSecondary/10 text-baseSecondary">
                        +{charity.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Charity website */}
                {charity.website && (
                  <div className="flex items-center text-sm text-baseSecondary/70 mb-4">
                    <Globe size={16} className="mr-1.5" />
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:text-baseSecondary hover:underline"
                    >
                      {charity.website
                        .replace(/(^\w+:|^)\/\//, "")
                        .replace(/\/$/, "")}
                    </a>
                  </div>
                )}

                <div className="flex space-x-3 mt-4">
                  <Link
                    to={`/charity/${charity.id}`}
                    className="flex-1 px-4 py-2 bg-basePrimary text-baseSecondary border border-baseSecondary/20 rounded-lg text-center hover:bg-basePrimary/80 transition-colors"
                  >
                    View Charity
                  </Link>

                  {userInfo ? (
                    isUserMember(charity.id) ? (
                      <Link
                        to={`/charity/${charity.id}`}
                        className="flex-1 px-4 py-2 bg-baseSecondary/10 text-baseSecondary rounded-lg text-center cursor-default"
                      >
                        Already Joined
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleJoinCharity(charity)}
                        className="flex-1 px-4 py-2 bg-baseSecondary text-basePrimaryLight rounded-lg text-center hover:bg-baseSecondary/90 transition-colors"
                      >
                        Join Charity
                      </button>
                    )
                  ) : (
                    <Link
                      to="/zitlogin"
                      className="flex-1 px-4 py-2 bg-baseSecondary text-basePrimaryLight rounded-lg text-center hover:bg-baseSecondary/90 transition-colors"
                    >
                      Sign in to Join
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center">
            <Buildings
              size={48}
              className="mx-auto text-baseSecondary/30 mb-3"
            />
            <h3 className="text-xl font-semibold text-baseSecondary mb-2">
              No charities found
            </h3>
            <p className="text-baseSecondary/70 mb-4">
              {searchTerm || selectedCategories.length > 0
                ? "Try adjusting your filters or search terms."
                : "There are no charities available at the moment."}
            </p>
            {(searchTerm || selectedCategories.length > 0) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-baseSecondary text-basePrimaryLight"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
      {/* Join Charity Modal */}
      {selectedCharity && (
        <JoinCharityModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          charityId={selectedCharity.id}
          charityName={selectedCharity.name}
          userRole={userInfo?.roles}
        />
      )}
    </div>
  );
}
