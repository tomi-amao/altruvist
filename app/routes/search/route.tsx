import { TaskStatus, TaskUrgency } from "@prisma/client";
import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import SearchResultCard from "~/components/cards/searchResultCard";
import TaskDetailsCard from "~/components/tasks/taskDetailsCard";
import Navbar from "~/components/navigation/Header2";
import { Modal } from "~/components/utils/Modal2";
import { CombinedCollections } from "~/types/tasks";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import { searchMultipleIndices } from "~/services/meilisearch.server";

export type SortOrder = "asc" | "desc";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  const { userInfo } = await getUserInfo(accessToken);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");

  const query = url.searchParams.get("query")
    ? decodeURIComponent(url.searchParams.get("query")!)
    : null;

  const searchResults = await searchMultipleIndices(query ?? "");

  return {
    page,
    userInfo,
    searchResults,
  };
}

export default function SearchResults() {
  const { userInfo, searchResults } = useLoaderData<typeof loader>();
  const [showCollections, setShowCollections] = useState({
    all: true,
    tasks: false,
    charities: false,
    users: false,
  });

  const [showSelectedSearchItem, setShowSelectedSearchItem] = useState(false);
  const [selectedSearchItem, setSelectedSearchItem] =
    useState<CombinedCollections>();

  const handleSelectedSearchItem = (selectedItemData: CombinedCollections) => {
    setShowSelectedSearchItem((preValue) => !preValue);

    setSelectedSearchItem(selectedItemData);
    console.log(
      "Status",
      showSelectedSearchItem,
      "Selected Data",
      selectedItemData,
    );
  };

  const handleCloseModal = () => {
    setShowSelectedSearchItem(false);
  };

  return (
    <>
      <Navbar userId={userInfo?.id} />
      <div className="m-auto lg:w-9/12  w-full py-4 px-2 ">
        <h1 className="mt-16"> Search Results </h1>

        <div>
          <ul>
            <li className="space-x-4 ">
              <button
                className={`hover:border-b-2 ${showCollections.all && "border-b-2"}`}
                onClick={() => {
                  setShowCollections((preState) => {
                    return {
                      ...preState,
                      all: true,
                      tasks: false,
                      charities: false,
                      users: false,
                    };
                  });
                }}
              >
                All
              </button>
              <button
                className={`hover:border-b-2 ${showCollections.tasks && "border-b-2"}`}
                onClick={() => {
                  setShowCollections((preState) => {
                    return {
                      ...preState,
                      tasks: true,
                      all: false,
                      charities: false,
                      users: false,
                    };
                  });
                }}
              >
                Tasks
              </button>
              <button
                className={`hover:border-b-2 ${showCollections.charities && "border-b-2"}`}
                onClick={() => {
                  setShowCollections((preState) => {
                    return {
                      ...preState,
                      tasks: false,
                      all: false,
                      charities: true,
                      users: false,
                    };
                  });
                }}
              >
                Charities
              </button>
              <button
                className={`hover:border-b-2 ${showCollections.users && "border-b-2"}`}
                onClick={() => {
                  setShowCollections((preState) => {
                    return {
                      ...preState,
                      tasks: false,
                      all: false,
                      charities: false,
                      users: true,
                    };
                  });
                }}
              >
                Users
              </button>
            </li>
          </ul>
          <div className="w-full border-t border-baseSecondary my-4"></div>
        </div>

        {searchResults &&
          searchResults.rawSearchedDocuments.map((document, index) => (
            <SearchResultCard
              key={index}
              collection={document?.collection}
              data={document?.data}
              all={showCollections.all}
              tasks={showCollections.tasks}
              charities={showCollections.charities}
              users={showCollections.users}
              handleSelectedSearchItem={(data) =>
                handleSelectedSearchItem(data)
              }
            />
          ))}
      </div>

      <Modal isOpen={showSelectedSearchItem} onClose={handleCloseModal}>
        <div>
          <TaskDetailsCard
            category={selectedSearchItem?.category}
            charityName={selectedSearchItem}
            id={selectedSearchItem}
            charityId={null}
            description={selectedSearchItem?.description}
            title={selectedSearchItem?.title}
            impact={selectedSearchItem?.impact}
            requiredSkills={selectedSearchItem?.requiredSkills}
            urgency={selectedSearchItem?.urgency}
            volunteersNeeded={selectedSearchItem?.volunteersNeeded}
            deliverables={selectedSearchItem?.deliverables}
            deadline={new Date(selectedSearchItem?.deadline)}
            userId={selectedSearchItem?.userId}
            status={selectedSearchItem?.status}
            resources={JSON.parse(selectedSearchItem?.resources || '[]')}
          />
        </div>
      </Modal>

      {/* <SearchResultCard /> */}
    </>
  );
}
