import { CombinedCollections, MultiSearchDocuments } from "~/types/tasks";
import { useNavigate } from "@remix-run/react";
import { getUrgencyColor } from "../tasks/taskCard";
import { Buildings, ClipboardText, User, Globe } from "@phosphor-icons/react";

export interface SearchResultCardType extends MultiSearchDocuments {
  all: boolean;
  tasks: boolean;
  charities: boolean;
  users: boolean;
  handleSelectedSearchItem: (selectedItemData: CombinedCollections) => void;
}

// Reusable styled tag component for consistency
const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-sm bg-baseSecondary/20    px-2  text-xs md:text-sm  mr-1">
    {children}
  </span>
);

// Reusable label component for consistency
const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="font-semibold text-xs md:text-sm mr-1">{children}:</span>
);

export default function SearchResultCard(searchResults: SearchResultCardType) {
  const navigate = useNavigate();

  // Extract domain from URL for cleaner display
  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      console.error("Invalid URL:", url, e);
      return url;
    }
  };

  const renderSearchResult = () => {
    switch (searchResults.collection) {
      case "altruvist_charities":
        if (searchResults.all || searchResults.charities) {
          return (
            <button
              className="flex text-left items-start bg-basePrimaryLight rounded-md mb-2 hover:bg-basePrimaryDark w-full p-3 transition-colors duration-200"
              onClick={() => navigate(`/charity/${searchResults.data.id}`)}
            >
              <div className="flex text-left items-start space-x-3 w-full">
                <span className="mt-1 text-baseSecondary">
                  <Buildings
                    size={28}
                    weight="regular"
                    className="text-baseSecondary"
                  />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-lg md:text-xl text-baseSecondary">
                    {searchResults.data.name}
                  </p>
                  <p className="text-xs md:text-sm mb-2 line-clamp-2">
                    {searchResults.data.description}
                  </p>

                  <div className="flex flex-wrap gap-y-2 gap-x-3 items-center">
                    {searchResults.data.tags &&
                      searchResults.data.tags.length > 0 && (
                        <div className="flex items-center flex-wrap">
                          <Label>Tags</Label>
                          {searchResults.data.tags.map((tag, index) => (
                            <Tag key={index}>{tag}</Tag>
                          ))}
                        </div>
                      )}

                    {searchResults.data.website && (
                      <div className="flex items-center">
                        <Label>Website</Label>
                        <span className="flex items-center text-xs md:text-sm bg-amber-200/40 px-2 rounded-md">
                          <Globe size={14} className="mr-1" />
                          {extractDomain(searchResults.data.website)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        }
        break;

      case "altruvist_tasks":
        if (searchResults.all || searchResults.tasks) {
          return (
            <button
              className="flex text-left items-start bg-basePrimaryLight rounded-md mb-2 hover:bg-basePrimaryDark w-full p-3 transition-colors duration-200"
              onClick={() =>
                searchResults.handleSelectedSearchItem(searchResults.data)
              }
            >
              <div className="flex text-left items-start space-x-3 w-full">
                <span className="mt-1 text-baseSecondary">
                  <ClipboardText
                    size={28}
                    weight="regular"
                    className="text-yellow-900"
                  />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-lg md:text-xl text-baseSecondary">
                    {searchResults.data.title}
                  </p>
                  <p className="text-xs md:text-sm mb-2 line-clamp-2">
                    {searchResults.data.description}
                  </p>

                  <div className="flex flex-wrap gap-y-2 gap-x-3 items-center">
                    {searchResults.data.urgency && (
                      <div className="flex items-center">
                        <Label>Urgency</Label>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getUrgencyColor(
                            searchResults.data.urgency || "LOW",
                          )}`}
                        >
                          {searchResults.data.urgency}
                        </span>
                      </div>
                    )}

                    {searchResults.data.requiredSkills &&
                      searchResults.data.requiredSkills.length > 0 && (
                        <div className="flex items-center flex-wrap">
                          <Label>Skills</Label>
                          {searchResults.data.requiredSkills.map(
                            (skill, index) => (
                              <Tag key={index}>{skill}</Tag>
                            ),
                          )}
                        </div>
                      )}

                    {searchResults.data.deadline && (
                      <div className="flex items-center">
                        <Label>Deadline</Label>
                        <span className="text-xs md:text-sm">
                          {new Date(
                            searchResults.data.deadline,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {searchResults.data.category &&
                      searchResults.data.category.length > 0 && (
                        <div className="flex items-center flex-wrap">
                          <Label>Category</Label>
                          {searchResults.data.category.map(
                            (category, index) => (
                              <Tag key={index}>{category}</Tag>
                            ),
                          )}
                        </div>
                      )}

                    {searchResults.data.estimatedHours && (
                      <div className="flex items-center">
                        <Label>Est. Hours</Label>
                        <span className="text-xs md:text-sm">
                          {searchResults.data.estimatedHours}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        }
        break;

      case "altruvist_users":
        if (searchResults.all || searchResults.users) {
          if (!searchResults.data?.roles || !searchResults.data.roles[0]) {
            return null;
          }

          return (
            <button
              className="flex text-left items-start bg-basePrimaryLight rounded-md mb-2 hover:bg-basePrimaryDark w-full p-3 transition-colors duration-200"
              onClick={() => navigate(`/profile/${searchResults.data.id}`)}
            >
              <div className="flex text-left items-start space-x-3 w-full">
                <span className="mt-1 text-baseSecondary">
                  <User size={28} weight="regular" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-lg md:text-xl text-baseSecondary">
                    {searchResults.data.name}
                  </p>
                  <p className="text-xs md:text-sm mb-2">
                    {searchResults.data.userTitle || "Volunteer"}
                  </p>

                  <div className="flex flex-wrap gap-y-2 gap-x-3 items-center">
                    {searchResults.data.roles &&
                      searchResults.data.roles.length > 0 && (
                        <div className="flex items-center">
                          <Label>Role</Label>
                          <span className="text-xs md:text-sm capitalize">
                            {searchResults.data.roles[0].toLowerCase()}
                          </span>
                        </div>
                      )}

                    {searchResults.data.skills &&
                      searchResults.data.skills.length > 0 && (
                        <div className="flex items-center flex-wrap">
                          <Label>Skills</Label>
                          {searchResults.data.skills.map((skill, index) => (
                            <Tag key={index}>{skill}</Tag>
                          ))}
                        </div>
                      )}

                    {searchResults.data.bio && (
                      <div className="hidden md:block w-full mt-1">
                        <span className="text-xs line-clamp-1">
                          {searchResults.data.bio}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        }
        break;

      default:
        return <div className="p-4 text-center">No search results found</div>;
    }
    return null;
  };

  return <>{renderSearchResult()}</>;
}
