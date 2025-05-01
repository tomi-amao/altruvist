import { useMemo } from "react";
import { MagnifyingGlass, UserPlus, Clock } from "@phosphor-icons/react";
import type { Charity } from "~/types/charities";
import type { charityApplications as Application } from "@prisma/client";

type CharityListProps = {
  charities: Charity[];
  selectedCharityId: string | null;
  onCharitySelect: (charity: Charity) => void;
  adminCharities: { id: string; name: string }[];
  pendingApplications: Application[];
  userApplications: Application[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export function CharityList({
  charities,
  selectedCharityId,
  onCharitySelect,
  adminCharities,
  pendingApplications,
  userApplications,
  searchQuery,
  setSearchQuery,
}: CharityListProps) {
  // Filter charities based on search query
  const filteredCharities = useMemo(() => {
    if (!searchQuery.trim()) return charities;

    const lowercaseQuery = searchQuery.toLowerCase();
    return charities.filter(
      (charity) =>
        charity.name.toLowerCase().includes(lowercaseQuery) ||
        charity.description.toLowerCase().includes(lowercaseQuery) ||
        (charity.tags &&
          charity.tags.some((tag) =>
            tag.toLowerCase().includes(lowercaseQuery),
          )),
    );
  }, [charities, searchQuery]);

  return (
    <div className="space-y-2 mt-8">
      {/* Search input */}
      <div className="flex flex-col space-y-2 p-2 bg-basePrimary rounded-lg">
        <div className="relative">
          <input
            type="text"
            placeholder="Search charities..."
            className="w-full px-8 py-1.5 border border-baseSecondary/20 rounded-lg bg-basePrimaryLight text-baseSecondary text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <MagnifyingGlass
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-baseSecondary/60"
          />
        </div>

        {userApplications.length > 0 && (
          <div className="bg-accentPrimary/10 py-1.5 px-2 rounded-md text-xs text-baseSecondary">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-baseSecondary" />
              <span className="font-medium">
                Pending applications:
                <span className="to-baseSecondary">
                  {userApplications.length}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Charities List */}
      <div className="space-y-1.5">
        {filteredCharities.length > 0 ? (
          filteredCharities.map((charity) => (
            <div
              key={charity.id}
              className={`text-left block w-full px-4 py-3 mb-2
                transition-all duration-200 ease-in-out
                border rounded-lg cursor-pointer
                ${
                  selectedCharityId === charity.id
                    ? "bg-baseSecondary/10 border-baseSecondary/30 shadow-sm"
                    : "bg-basePrimary border-baseSecondary/10 hover:border-baseSecondary/30 hover:bg-baseSecondary/5"
                }
              `}
              onClick={() => onCharitySelect(charity)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCharitySelect(charity);
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={selectedCharityId === charity.id}
            >
              <div className="flex justify-between items-start">
                <div className="w-full">
                  <h3 className="font-semibold text-baseSecondary text-base sm:text-lg">
                    {charity.name}
                  </h3>
                  <p className="text-base text-baseSecondary/70 line-clamp-1 mt-0.5 leading-tight">
                    {charity.description}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-1.5 flex-wrap gap-1">
                {/* Show badge if user is admin of this charity */}
                {adminCharities.some((ac) => ac.id === charity.id) && (
                  <span className="inline-flex text-sm items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-confirmPrimary/20 text-confirmPrimary leading-none">
                    Admin
                  </span>
                )}

                {/* Show pending applications count if user is admin */}
                {pendingApplications.filter(
                  (app) => app.charityId === charity.id,
                ).length > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accentPrimary/20 text-indicator-orange leading-none">
                    <UserPlus size={10} className="mr-0.5" />
                    {
                      pendingApplications.filter(
                        (app) => app.charityId === charity.id,
                      ).length
                    }
                    pending
                  </span>
                )}

                {/* Show if user has applied to this charity */}
                {userApplications.some(
                  (app) => app.charityId === charity.id,
                ) && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accentSecondary/20 text-accentSecondary leading-none ml-auto">
                    <Clock size={10} className="mr-0.5" />
                    Application Pending
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center bg-basePrimary rounded-lg">
            <p className="text-baseSecondary text-sm">No charities found</p>
            {searchQuery && (
              <button
                className="mt-1 text-accentPrimary hover:underline text-xs"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
