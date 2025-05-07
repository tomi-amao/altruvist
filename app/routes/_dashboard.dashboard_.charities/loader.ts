import { LoaderFunctionArgs, redirect } from "react-router";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import { getCharityApplications } from "~/models/charities.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  if (!accessToken) {
    return redirect("/zitlogin");
  }

  try {
    // Get user info and charity memberships in one call
    const { userInfo, charityMemberships } = await getUserInfo(accessToken);

    if (!userInfo?.id) {
      return redirect("/zitlogin");
    }

    const { id: userId, roles: userRole } = userInfo;

    // Extract user's charities from charity memberships
    const userCharities =
      charityMemberships?.memberships?.map((membership) => ({
        id: membership.charity.id,
        name: membership.charity.name,
        roles: membership.roles,
        permissions: membership.permissions,
      })) || [];

    // Get all charities where the user is an admin for admin functionality
    const adminCharities = userCharities
      .filter((charity) =>
        charity.roles.some((role) => ["admin", "creator"].includes(role)),
      )
      .map((charity) => ({
        id: charity.id,
        name: charity.name,
      }));

    // Use charities from memberships directly, instead of fetching them again
    const charitiesList =
      charityMemberships?.memberships?.map(
        (membership) => membership.charity,
      ) || [];

    let pendingApplications = [];
    let userApplications = [];

    // Create a Promise.all for parallel requests with only what's needed
    const parallelRequests = [
      // Get pending applications for admin charities
      adminCharities.length > 0
        ? Promise.all(
            adminCharities.map((charity) =>
              getCharityApplications({
                charityId: charity.id,
                status: "PENDING",
              }),
            ),
          )
        : Promise.resolve([]),

      // Get user's applications
      getCharityApplications({ userId }).catch(() => ({ applications: [] })),
    ];

    // Wait for all promises to resolve
    const [applicationResults, userApplicationsResult] =
      await Promise.all(parallelRequests);

    // Process pending applications
    if (adminCharities.length > 0) {
      pendingApplications = applicationResults
        .filter(
          (result) => result.applications && result.applications.length > 0,
        )
        .flatMap((result) => result.applications);
    }

    // Process user applications
    userApplications = userApplicationsResult.applications || [];

    return {
      userInfo,
      userRole,
      userId,
      userCharities,
      adminCharities,
      charities: charitiesList,
      pendingApplications,
      userApplications,
      COMPANION_URL: process.env.COMPANION_URL,
    };
  } catch (error) {
    console.error("Error in loader function:", error);
    return { error: "An unexpected error occurred" };
  }
}
