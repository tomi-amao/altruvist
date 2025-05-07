import { LoaderFunctionArgs } from "react-router";
import { getCharityMemberships } from "~/models/charities.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { charityId } = params;

  if (!charityId) {
    return { error: "Charity ID is required", members: [] }
  }

  try {
    // Get members for the charity
    const result = await getCharityMemberships({
      charityId,
    });

    if (!result.memberships) {
      return{ error: "Failed to fetch charity members", members: [] }
    }

    return { members: result.memberships };
  } catch (error) {
    console.error("Error fetching charity members:", error);
    return { error: "Failed to fetch charity members", members: [] };
  }
}
