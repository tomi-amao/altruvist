import { CombinedCollections, MultiSearchDocuments } from "~/types/tasks";

import { useNavigate } from "@remix-run/react";
import { getUrgencyColor } from "../tasks/taskCard";
import { Buildings, ClipboardText, User } from "phosphor-react";

export interface SearchResultCardType extends MultiSearchDocuments {
  all: boolean;
  tasks: boolean;
  charities: boolean;
  users: boolean;
  handleSelectedSearchItem: (selectedItemData: CombinedCollections) => void;
}

export default function SearchResultCard(searchResults: SearchResultCardType) {
  const navigate = useNavigate();

  const renderSearchResult = () => {
    switch (searchResults.collection) {
      case "skillanthropy_charities":
        if (searchResults.all || searchResults.charities) {
          return (
            <button
              className="flex text-left items-center bg-basePrimaryDark  rounded-md mb-2 hover:bg-basePrimaryLight w-full p-2"
              onClick={() => console.log()}
            >
              {/* mobile view component */}
              <div
                className="flex  text-left items-center m-auto  rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2 md:font-semibold"
                // onClick={() => handleSelectedSearchItem(searchResults.data)}
              >
                <span>
                  <Buildings size={24} weight="regular" />
                </span>
                <div>
                  <p className="font-semibold md:text-lg">
                    {searchResults.data.name}
                  </p>
                  <p className="text-xs md:text-sm mb-1">
                    {searchResults.data.description}
                  </p>

                  <ul className="flex gap-2 items-center">
                    {searchResults.data.tags && (
                      <li className="text-xs md:text-sm font-semibold ">
                        Tags:
                        {searchResults.data?.tags.map((skill, index) => (
                          <span
                            key={index}
                            className="rounded-sm  md:text-sm font-semibold bg-basePrimaryLight px-1 text-[12px]"
                          >
                            {skill}
                          </span>
                        ))}
                      </li>
                    )}

                    <li className="text-xs  md:text-sm font-semibold">
                      Website:
                      {searchResults.data.website && (
                        <span className="font-normal md:text-sm text-xs">
                          {/* {new URL(searchResults.data.website).hostname }  */}
                        </span>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </button>
          );
        }
        break;

      case "skillanthropy_tasks":
        if (searchResults.all || searchResults.tasks) {
          return (
            <button
              className="flex text-left items-center bg-basePrimaryDark rounded-md mb-2 hover:bg-basePrimaryLight w-full p-2"
              onClick={() =>
                searchResults.handleSelectedSearchItem(searchResults.data)
              }
            >
              {/* mobile view component */}
              <div
                className="flex  text-left items-center m-auto  rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2  "
                // onClick={() => handleSelectedSearchItem(searchResults.data)}
              >
                <span>
                  <ClipboardText size={24} weight="regular" />
                </span>
                <div className="">
                  <p className="font-semibold md:text-lg">
                    {searchResults.data.title}
                  </p>
                  <p className="text-xs md:text-sm mb-1">
                    {searchResults.data.description}
                  </p>
                  <ul className="flex gap-2  items-start flex-wrap">
                    <li className="text-xs md:text-sm font-semibold">
                      Urgency:
                      <span
                        className={`  inline-block rounded-full px-2 md:px-2 md:py-[2px] ml-1 text-xs font-semibold ${getUrgencyColor(searchResults.data.urgency || "LOW")}`}
                      >
                        {searchResults.data.urgency}
                      </span>
                    </li>
                    {searchResults.data.requiredSkills && (
                      <li className="text-xs  md:text-sm font-semibold space-x-1">
                        Skills:
                        {searchResults.data?.requiredSkills.map(
                          (skill, index) => (
                            <span
                              key={index}
                              className="rounded-sm font-semibold bg-basePrimaryLight px-1 text-[12px]"
                            >
                              {skill}
                            </span>
                          ),
                        )}
                      </li>
                    )}
                    {
                      <li className="text-xs flex-wrap md:text-sm font-semibold">
                        Deadline:
                        <span className="font-normal md:text-sm text-xs ">
                          {new Date(
                            searchResults.data.deadline,
                          ).toLocaleDateString()}
                        </span>
                      </li>
                    }
                    {searchResults.data.category && (
                      <li className="text-xs md:text-sm  font-semibold">
                        Tags:
                        <span className="font-normal md:text-sm text-xs">
                          {searchResults.data?.category.map((tag, index) => (
                            <span
                              key={index}
                              className="rounded-sm font-semibold bg-basePrimaryLight px-1 text-[12px]"
                            >
                              {tag}
                            </span>
                          ))}
                        </span>
                      </li>
                    )}

                    {searchResults.data.deliverables && (
                      <li className="text-xs md:text-sm hidden md:flex font-semibold">
                        Deliverable:
                        <span className="font-normal md:text-sm text-xs">
                          {searchResults.data.deliverables[0]}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </button>
          );
        }
        break;

      case "skillanthropy_users":
        if (searchResults.all || searchResults.users) {
          return (
            <>
              {searchResults.data?.roles[0] && (
                <button
                  className="flex text-left items-center bg-basePrimaryDark rounded-md mb-2 hover:bg-basePrimaryLight w-full p-2"
                  onClick={() => navigate(`/profile/${searchResults.data.id}`)}
                >
                  {/* mobile view component */}
                  <div
                    className="flex  text-left items-center m-auto  rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2 md:font-semibold"
                    // onClick={() => handleSelectedSearchItem(searchResults.data)}
                  >
                    <span>
                      <User size={24} weight="regular" />
                    </span>
                    <div>
                      <p className="font-semibold md:text-lg">
                        {searchResults.data.name}
                      </p>
                      <p className="text-xs md:text-sm mb-1">
                        {searchResults.data.userTitle}
                      </p>

                      <ul className="flex gap-2  items-center">
                        {searchResults.data?.roles[0] && (
                          <li className="text-xs md:text-sm font-semibold">
                            Type:
                            <span className="font-normal md:text-sm ml-1 text-xs">
                              {searchResults.data.roles[0]
                                ?.charAt(0)
                                ?.toUpperCase() +
                                searchResults.data.roles[0]
                                  ?.slice(1)
                                  ?.toLowerCase()}
                            </span>
                          </li>
                        )}
                        {searchResults.data.skills && (
                          <li className="text-xs md:text-sm space-x-1 font-semibold">
                            Skills:
                            {searchResults.data?.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="rounded-sm  md:text-sm font-semibold  bg-basePrimaryLight px-1 text-[12px]"
                              >
                                {skill}
                              </span>
                            ))}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* laptop/desktop screen component */}
                </button>
              )}
            </>
          );
        }
        break;

      default:
        return <div>No search results found</div>;
    }
  };
  return <>{renderSearchResult()}</>;
}
