import { useState } from "react";
import { SecondaryButton } from "~/components/utils/BasicButton";
import type { Charity } from "~/types/charities";
import type { tasks } from "@prisma/client";
import CharityTasksSection from "../tasks/CharityTasksSection";
import { ArrowSquareOut, ShareNetwork, Check } from "@phosphor-icons/react";

type CharityDetailsProps = {
  charity: Charity;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: (charityId: string) => void;
  activeTab: "details" | "applications" | "members" | "tasks";
  setActiveTab: (tab: "details" | "applications" | "members" | "tasks") => void;
  pendingApplicationsCount: number;
  signedBackgroundUrl?: string;
  charityTasks?: tasks[];
  onTaskSelect?: (task: tasks) => void;
};

export function CharityDetails({
  charity,
  isAdmin,
  onEdit,
  onDelete,
  activeTab,
  setActiveTab,
  pendingApplicationsCount,
  signedBackgroundUrl,
  charityTasks = [],
  onTaskSelect,
}: CharityDetailsProps) {
  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/charity-resources.png"; // Fallback to a default image
  };

  // State for share tooltip
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // Handle sharing charity link
  const handleShare = () => {
    const charityUrl = `${window.location.origin}/charity/${charity.id}`;

    navigator.clipboard
      .writeText(charityUrl)
      .then(() => {
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy URL: ", err);
      });
  };

  return (
    <>
      <div className="bg-basePrimaryLight rounded-xl shadow-sm overflow-hidden h-fit mt-14 relative">
        {/* Charity Header */}
        <div className="relative h-40 bg-gradient-to-r from-accentPrimary/30 to-accentSecondary/30">
          {signedBackgroundUrl ? (
            <img
              src={signedBackgroundUrl}
              alt={charity.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : charity.backgroundPicture ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-baseSecondary/50">Image loading...</p>
            </div>
          ) : null}
          <div className="absolute inset-0 bg-baseSecondary/50 flex items-center justify-center p-6">
            <h1 className="text-4xl font-bold text-basePrimary text-center">
              {charity.name}
            </h1>
          </div>
        </div>

        {/* Share button - Repositioned to be more visible */}
        <div className="absolute top-2 right-2 z-10">
          <div className="relative">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium 
              text-baseSecondary bg-basePrimary/90 hover:bg-basePrimary
              border border-baseSecondary/10 hover:border-baseSecondary/20
              transition-all duration-300 shadow-sm hover:shadow-md"
              aria-label="Share this charity"
            >
              <ShareNetwork className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {/* Copy success tooltip */}
            {showShareTooltip && (
              <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-confirmPrimary text-basePrimary text-xs rounded-lg shadow-md flex items-center gap-1.5 whitespace-nowrap z-20">
                <Check className="w-3.5 h-3.5" />
                <span>Link copied!</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-baseSecondary/10">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "details"
                ? "text-baseSecondary border-b-2 border-baseSecondary"
                : "text-basePrimaryDark hover:text-baseSecondary"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>

          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "tasks"
                ? "text-baseSecondary font-semibold border-b-2 border-baseSecondary"
                : "text-basePrimaryDark hover:text-baseSecondary"
            }`}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks
            {charityTasks && charityTasks.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-baseSecondary/10 text-indicator-orange">
                {charityTasks.length}
              </span>
            )}
          </button>

          {/* Only show Applications tab for charity admins */}
          {isAdmin && (
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "applications"
                  ? "text-baseSecondary border-b-2 border-baseSecondary"
                  : "text-basePrimaryDark hover:text-baseSecondary"
              }`}
              onClick={() => setActiveTab("applications")}
            >
              Applications
              {pendingApplicationsCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-accentPrimary/20 text-indicator-orange">
                  {pendingApplicationsCount}
                </span>
              )}
            </button>
          )}

          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "members"
                ? "text-baseSecondary border-b-2 border-baseSecondary"
                : "text-basePrimaryDark hover:text-baseSecondary"
            }`}
            onClick={() => setActiveTab("members")}
          >
            Members
          </button>
        </div>
      </div>
      <div className="bg-basePrimaryLight rounded-xl shadow-sm overflow-hidden h-fit mt-4">
        {/* Details Tab Content */}
        {activeTab === "details" && (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-baseSecondary mb-2">
                  About
                </h2>
                <p className="text-baseSecondary/80 whitespace-pre-wrap">
                  {charity.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {charity.website && (
                  <div className="bg-basePrimary/30 p-3 rounded-lg  transition-all">
                    <h3 className="text-sm font-medium text-baseSecondary/70 mb-1">
                      Website
                    </h3>
                    <a
                      href={`https://${charity.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accentPrimary hover:text-accentSecondary flex items-center gap-2"
                    >
                      <ArrowSquareOut
                        size={16}
                        className="flex-shrink-0 text-baseSecondary"
                      />
                      <span className="truncate">{charity.website}</span>
                    </a>
                  </div>
                )}

                {charity.contactEmail && (
                  <div>
                    <h3 className="text-sm font-medium text-baseSecondary/70">
                      Contact Email
                    </h3>
                    <a
                      href={`mailto:${charity.contactEmail}`}
                      className="text-accentPrimary hover:underline"
                    >
                      {charity.contactEmail}
                    </a>
                  </div>
                )}
              </div>

              {charity.tags && charity.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-baseSecondary/70 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {charity.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-baseSecondary/10 text-baseSecondary rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && (
                <div className="pt-4 border-t border-baseSecondary/10 flex gap-3 justify-end">
                  <SecondaryButton
                    text="Edit Charity"
                    ariaLabel="Edit charity details"
                    action={onEdit}
                  />
                  <SecondaryButton
                    text="Delete Charity"
                    ariaLabel="Delete this charity"
                    action={() => onDelete(charity.id)}
                    className="text-dangerPrimary border-dangerPrimary hover:bg-dangerPrimary/10"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {/* Tasks Tab Content */}
        {activeTab === "tasks" && (
          <div className="p-6">
            {isAdmin && (
              <div className="flex justify-end mb-4">
                <a
                  href="/dashboard/tasks"
                  className="text-baseSecondary hover:underline text-sm"
                >
                  Manage Tasks
                </a>
              </div>
            )}

            {charityTasks && charityTasks.length > 0 ? (
              <CharityTasksSection
                tasks={charityTasks}
                onTaskSelect={onTaskSelect}
                charityName={charity.name}
              />
            ) : (
              <div className="text-center py-12 bg-basePrimary/40 rounded-lg border border-baseSecondary/10">
                <p className="text-baseSecondary/70">
                  No tasks available for this charity yet.
                </p>
                {isAdmin && (
                  <a
                    href="/dashboard/tasks"
                    className="mt-4 inline-block px-4 py-2 bg-accentPrimary   rounded-md hover:bg-accentPrimary/90 text-baseSecondary transition"
                  >
                    Create Task
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
