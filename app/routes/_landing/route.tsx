import { users } from "@prisma/client";
import { LoaderFunctionArgs, Outlet, useLoaderData } from "react-router";

import LandingHeader from "~/components/navigation/LandingHeader";
import { getUserInfo } from "~/models/user2.server";
import { getSignedUrlForFile } from "~/services/s3.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  const novuAppId = process.env.NOVU_APP_ID;
  let { userInfo } = await getUserInfo(accessToken);
  let signedProfilePictureUrl: string | null = null;
  if (userInfo) {
    // Only get signed URL if profile picture exists and is not empty
    signedProfilePictureUrl =
      userInfo.profilePicture && userInfo.profilePicture.trim() !== ""
        ? await getSignedUrlForFile(userInfo.profilePicture, true)
        : null;
    userInfo = {
      ...userInfo,
      profilePicture: signedProfilePictureUrl ?? userInfo.profilePicture,
    };
  }

  // Update userInfo with signed URL if available

  return { userInfo, novuAppId };
}

export default function LandingTemplate() {
  const { userInfo } = useLoaderData<typeof loader>();
  return (
    <>
      <LandingHeader
        userId={userInfo?.id}
        userInfo={userInfo as users}
        profilePicture={userInfo?.profilePicture || undefined}
      />
      <div className="m-auto lg:w-9/12  w-full py-4 px-2 ">
        <h1 className="mt-8"> </h1>

        <Outlet />
      </div>
    </>
  );
}
