import { json, LoaderFunctionArgs } from "@remix-run/node";
import { getCharityMemberships } from "~/models/charities.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { charityId } = params;

  if (!charityId) {
    return json(
      { error: "Charity ID is required", members: [] },
      { status: 400 },
    );
  }

  try {
    // Get members for the charity
    const result = await getCharityMemberships({
      charityId,
    });

    if (!result.memberships) {
      return json(
        { error: "Failed to fetch charity members", members: [] },
        { status: 500 },
      );
    }

    return json({ members: result.memberships });
  } catch (error) {
    console.error("Error fetching charity members:", error);
    return json(
      { error: "Failed to fetch charity members", members: [] },
      { status: 500 },
    );
  }
}
