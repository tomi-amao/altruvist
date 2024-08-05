import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import {
  Outlet,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DropdownOptions } from "~/components/cards/CreatePostCard";
import PostCard from "~/components/cards/PostCard";
import FormOptions from "~/components/utils/FormField";
import {
  filterOptionsConstant,
  sortOptionsConstant,
} from "~/components/utils/OptionsForDropdowns";
import { getPosts } from "~/models/posts.server";
import { getUserById, requireUserId } from "~/models/user.server";
import { SecondaryButton } from "~/components/utils/BasicButton";
import { Prisma } from "@prisma/client";
import { useInView } from "react-intersection-observer";

export const meta: MetaFunction = () => {
  return [{ title: "Feed" }, { name: "Your feed", content: "List all posts" }];
};

export default function Feed() {
  const getPosts = useActionData<typeof action>();
  const { referer } = useLoaderData<typeof loader>();
  const [index, setIndex] = useState<number>(4);

  const {
    ref: loaderRef,
    inView,
  } = useInView({
    threshold: 0,
  });
  const location = useLocation();
  const submit = useSubmit();
  const navigate = useNavigate();

  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === `/feed${location.search}`;
  const allPosts = getPosts?.allPosts;

  const loadMorePosts = useCallback(() => {
    if (inView) {
      setIndex((prevIndex) => prevIndex + 1);
      console.log("PATHNAME", location.pathname);

      if (location.pathname === "/feed") {
        submit(
          { index },
          { method: "POST", action: `/feed${location.search}` }
        );
      }
    }
  }, [inView]);

  useEffect(() => {
    loadMorePosts();
  }, [inView, loadMorePosts]);

  // get posts after user creates a post
  useEffect(() => {
    if (referer?.includes("feed/create/post")) {
      submit({ index }, { method: "POST", action: `/feed${location.search}` });
    }
  }, [referer]);

  // manage sort dropdown state
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortSelected, setSortSelected] = useState({ option: "Sort", id: 0 });

  // manage filter dropdown state
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [filterSelected, setFilterSelected] = useState({
    option: "Filter",
    id: 0,
  });

  //manage selected filters in an array
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const filterRef = useRef<string[]>([]);

  //manage SearchParams
  const [searchParams, setSearchParams] = useSearchParams();

  const newSearchParams = new URLSearchParams(searchParams);

  const sortAndFilterAction = (selectedOption: {
    id: number;
    option: string;
  }) => {
    if (sortOptionsConstant.includes(selectedOption)) {
      // ensure valid sort option
      newSearchParams.set("sort", selectedOption.option);
    } else {
      console.warn(`Invalid sort option: ${selectedOption.option}`);
    }
    if (filterOptionsConstant.includes(selectedOption)) {
      if (!tagFilters.includes(selectedOption.option)) {
        setTagFilters([...tagFilters, selectedOption.option]);
        filterRef.current = [...tagFilters, selectedOption.option];
      }

      const encodedTagFilters = JSON.stringify(filterRef.current);

      newSearchParams.set("filter", encodedTagFilters);
    }

    setSearchParams(newSearchParams, { preventScrollReset: true });
  };

  const clearSearchParams = () => {
    setSearchParams({}, { preventScrollReset: true });
    setTagFilters([]);
    filterRef.current = [...tagFilters];
    return {};
  };

  useEffect(() => {
    setShowSortOptions(false);
    setShowFilterOptions(false);
  }, [searchParams]);

  return (
    <>
      <div className="p-12 w-full ">
        <div className="w-full  text-lightGrey text-2xl">
          <h1 className="pb-4"> Feed</h1>
          <button
            className="flex md:w-full h-fit  bg-midGrey text-altMidGrey rounded-md mb-4 hover:bg-lightGrey hover:text-darkGrey cursor-pointer"
            onClick={() => {
              navigate("/feed/create/post");
            }}
          >
            <p className=" flex gap-4 items-center w-full flex-grow text-sm p-2 px-3">
              Share a problem and/or a solution
            </p>
          </button>
          <div className="flex items-center gap-4">
            <FormOptions
              setShowOptions={setShowSortOptions}
              showOptions={showSortOptions}
              selected={sortSelected}
              setSelected={setSortSelected}
              dropDownOptions={
                <DropdownOptions
                  options={sortOptionsConstant}
                  setSelected={setSortSelected}
                  setShowOptions={setShowSortOptions}
                  optionAction={sortAndFilterAction}
                  selected={sortSelected}
                />
              }
            />
            <FormOptions
              setShowOptions={setShowFilterOptions}
              showOptions={showFilterOptions}
              selected={filterSelected}
              setSelected={setFilterSelected}
              dropDownOptions={
                <DropdownOptions
                  options={filterOptionsConstant}
                  setSelected={setFilterSelected}
                  selected={filterSelected}
                  setShowOptions={setShowFilterOptions}
                  optionAction={sortAndFilterAction}
                />
              }
            />
            <SecondaryButton text="clear" action={clearSearchParams} />
          </div>
          <div className="flex flex-col gap-4">
            {allPosts?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
        <div ref={loaderRef} className="flex  m-auto w-fit pt-1 ">
          {isSubmitting && <Loading />}
        </div>
        <Outlet />
      </div>
    </>
  );
}

export function Loading() {
  return (
    <>
      <svg
        className="animate-spin -ml-1 mr-3 h-5 w-5 text-txtprimary "
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </>
  );
}
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const userDetails = await getUserById(userId!, { profile: true });
  const body = await request.formData();

  const action = body.get("index");

  // extract url queries sort and filter by constructing a new url and getSearchParams
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort");

  const filter = url.searchParams.get("filter");

  if (userId) {
    let allPosts = await getPosts({ updatedAt: "desc" }, {});

    //apply filters

    let sortOptions: Prisma.PostsOrderByWithRelationInput = {};
    if (sort) {
      if (sort === "date") {
        sortOptions = { createdAt: "desc" };
      }
      if (sort === "sender") {
        sortOptions = { author: { profile: { firstName: "desc" } } };
      }
    }

    let tagFilter: Prisma.PostsWhereInput = {};
    // do not add tag filter if there are no tags
    if (filter && filter.length > 0) {
      const parseFilters: string[] = JSON.parse(filter);

      tagFilter = {
        tags: { hasSome: parseFilters },
      };
    }
    if (
      Object.entries(tagFilter).length ||
      Object.entries(sortOptions).length
    ) {
      if (action) {
        allPosts = await getPosts(sortOptions, tagFilter, +action!);

        return json({ allPosts }, { status: 200 });
      }
    }

    if (action) {
      const allPosts = await getPosts({ updatedAt: "desc" }, {}, +action);
      return json({ allPosts }, { status: 200 });
    }

    return { userId, userDetails, allPosts };
  } else {
    redirect("/login");
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  await getPosts({ updatedAt: "desc" }, {});
  const headers = new Headers(request.headers);

  const referer = headers.get("referer");

  return { referer };
}
