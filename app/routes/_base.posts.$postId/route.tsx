import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getPost } from "~/models/posts.server";

export default function PostPage() {
  const loadedData = useLoaderData<typeof loader>();
  if (!loadedData.postData) {
    // Handle case when post is not found
    return (
      <div className="">
        <h2>Post Not Found</h2>
        <p>Sorry, the requested post could not be found.</p>
      </div>
    );
  }

  const { title, content, type, createdAt, id } = loadedData.postData;
  return (
    <>
      <div className="w-full">
        <PostBannerSummary
          charity="Canopy"
          deadline={createdAt}
          title={title}
          type={type}
          key={id}
        />
        <div className="border-solid border-txtsecondary mx-36 bg-midGrey mt-4 h-fit rounded-md p-6 text-lightGrey">
          <div className=" pb-4">
            <h1 className="font-semibold pb-2">{title}</h1>
            <p>{content}</p>
          </div>
          <div className="pb-4">
            <h1 className="font-semibold pb-4"> Attachments</h1>
            <div className="flex flex-row gap-4 ">
              <button className="bg-bgprimary rounded-md w-fit p-1 px-6">
                PDF
              </button>
              <button className="bg-bgprimary rounded-md w-fit p-1 px-6">
                PNG
              </button>
              <button className="bg-bgprimary rounded-md w-fit p-1 px-6">
                EXCEL
              </button>
              <button className="bg-bgprimary rounded-md w-fit p-1 px-6">
                ZIP
              </button>
            </div>
          </div>
          <div className="pb-4">
            <h1 className="font-semibold pb-4"> Status</h1>
            <div className="flex flex-row gap-4 ">
              <button className="bg-bgprimary rounded-md w-fit p-1 px-6">
                Looking for volunteers
              </button>
            </div>
          </div>
          <div className=" w-fit flex flex-row m-auto gap-4">
            <button className="text-lightGrey text-xs"> View Charity</button>
            <button className=" w-fit bg-bgprimary p-2 px-6 rounded-md">
              {" "}
              Volunteer{" "}
            </button>
            <button className="text-lightGrey text-xs"> Bookmark</button>
          </div>
        </div>
      </div>
    </>
  );
}
interface PostBannerSummaryTitles {
  title: string;
  deadline: string;
  charity: string;
  type: string | null;
}
export const PostBannerSummary = ({
  title,
  deadline,
  charity,
  type,
}: PostBannerSummaryTitles) => {
  return (
    <div className="mx-36 rounded-md text-lightGrey text-2xl mt-16 bg-bgsecondary flex flex-row gap-10 justify-evenly p-4">
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Title</h1>
        <h2 className="text-base">{title}</h2>
      </div>
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Deadline</h1>
        <h2 className="text-base">{deadline}</h2>
      </div>
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Charity</h1>
        <h2 className="text-base">{charity}</h2>
      </div>
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Type</h1>
        <h2 className="text-base">{type}</h2>
      </div>
    </div>
  );
};

export async function loader({ params }: LoaderFunctionArgs) {
  console.log(params);
  const post = await getPost(params.postId);

  return post;
}
