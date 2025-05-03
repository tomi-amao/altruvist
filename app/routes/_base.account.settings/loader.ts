import { LoaderFunctionArgs, redirect, json } from "@remix-run/node";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import { getCharityMemberships } from "~/models/charities.server";
import { getSignedUrlForFile } from "~/services/s3.server";
import { getFeatureFlags, getCompanionVars } from "~/services/env.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  // Get detailed user info
  const { userInfo } = await getUserInfo(accessToken);
  const { FEATURE_FLAG } = getFeatureFlags();
  const { COMPANION_URL } = getCompanionVars();

  if (!userInfo) {
    return redirect("/zitlogin");
  }

  // Get charity memberships where user is an admin or creator
  const { memberships } = await getCharityMemberships({ userId: userInfo.id });

  // Find all charities where the user is an admin or creator
  const managedCharities =
    memberships
      ?.filter((membership) => membership.roles.includes("creator"))
      .map((membership) => membership.charity) || [];

  // Get signed URL for profile picture
  let signedProfilePicture;
  if (userInfo.profilePicture) {
    signedProfilePicture = await getSignedUrlForFile(
      userInfo.profilePicture,
      true,
    );
  }

  return json({
    userInfo,
    managedCharities,
    signedProfilePicture,
    FEATURE_FLAG,
    COMPANION_URL,
  });
}
