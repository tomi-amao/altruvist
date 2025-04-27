import { json, LoaderFunctionArgs } from "@remix-run/node";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import { getCharityMemberships } from "~/models/charities.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { charityId } = params;

  if (!charityId) {
    return json(
      { error: "Charity ID is required", members: [] },
      { status: 400 },
    );
  }

  try {
    // Get authenticated user info to check permissions if needed
    const session = await getSession(request);
    const accessToken = session.get("accessToken");

    let userInfo = null;
    if (accessToken) {
      const { userInfo: user } = await getUserInfo(accessToken);
      userInfo = user;
    }

    // Get members for the charity
    const { memberships, error, status } = await getCharityMemberships({
      charityId,
    });

    if (error || !memberships) {
      return json(
        { error: error || "Failed to fetch charity members", members: [] },
        { status: status || 500 },
      );
    }

    return json({ members: memberships });
  } catch (error) {
    console.error("Error fetching charity members:", error);
    return json(
      { error: "Failed to fetch charity members", members: [] },
      { status: 500 },
    );
  }
}
