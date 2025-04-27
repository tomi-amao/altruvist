import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import {
  getCharity,
  getCharityApplications,
} from "~/models/charities.server";

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
    const userCharities = charityMemberships?.memberships?.map(membership => ({
      id: membership.charity.id,
      name: membership.charity.name,
      roles: membership.roles,
      permissions: membership.permissions,
    })) || [];

    // Get all charities where the user is an admin for admin functionality
    const adminCharities = userCharities
      .filter(charity => charity.roles.includes("admin"))
      .map(charity => ({
        id: charity.id,
        name: charity.name,
      }));

    // Data to fetch in parallel
    const allUserCharityIds = userCharities.map(charity => charity.id);
    let charitiesList = [];
    let pendingApplications = [];
    let userApplications = [];

    // Create a Promise.all for parallel requests
    const parallelRequests = [
      // Get detailed charity information
      allUserCharityIds.length > 0 
        ? Promise.all(
            allUserCharityIds.map(charityId => 
              getCharity(charityId, { charityMemberships: true })
            )
          )
        : Promise.resolve([]),
          
      // Get pending applications for admin charities
      adminCharities.length > 0
        ? Promise.all(
            adminCharities.map(charity =>
              getCharityApplications({
                charityId: charity.id,
                status: "PENDING",
              })
            )
          )
        : Promise.resolve([]),
        
      // Get user's applications
      getCharityApplications({ userId }).catch(() => ({ applications: [] }))
    ];

    // Wait for all promises to resolve
    const [charityResults, applicationResults, userApplicationsResult] = 
      await Promise.all(parallelRequests);

    // Process charity results
    if (allUserCharityIds.length > 0) {
      charitiesList = charityResults
        .filter(result => result.charity)
        .map(result => result.charity);
    }

    // Process pending applications
    if (adminCharities.length > 0) {
      pendingApplications = applicationResults
        .filter(result => result.applications && result.applications.length > 0)
        .flatMap(result => result.applications);
    }

    // Process user applications
    userApplications = userApplicationsResult.applications || [];

    return json({
      userInfo,
      userRole,
      userId,
      userCharities,
      adminCharities,
      charities: charitiesList,
      pendingApplications,
      userApplications,
      COMPANION_URL: process.env.COMPANION_URL,
    });
  } catch (error) {
    console.error("Error in loader function:", error);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}