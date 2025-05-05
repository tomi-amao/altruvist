import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { getUserInfo } from "~/models/user2.server";
import { prisma } from "~/services/db.server";
import {
  isMeilisearchConnected,
  client,
  INDICES,
} from "~/services/meilisearch.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const { userInfo, zitUserInfo } = await getUserInfo(accessToken);

  if (!userInfo) {
    return redirect("/zitlogin");
  }

  const roles = zitUserInfo?.["urn:zitadel:iam:org:project:roles"] as Record<
    string,
    unknown
  >;
  const role = roles ? Object.keys(roles).join(", ") : "User";

  console.log("Role:", role);

  if (role !== "admin") {
    throw new Error("You are not authorized to access this page");
  }

  // Check Meilisearch connection status
  const isConnected = await isMeilisearchConnected();

  // Get some sample data to use in tests
  const sampleTasks = await prisma.tasks.findMany({ take: 5 });
  const sampleUsers = await prisma.users.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      skills: true,
      bio: true,
    },
  });
  const sampleCharities = await prisma.charities.findMany({ take: 5 });

  // Get indices stats
  let indicesStats = null;
  if (isConnected) {
    try {
      // Add debug logging
      console.log("Connected to Meilisearch, getting stats...");
      console.log("Available indices:", Object.values(INDICES));

      // Get stats for each predefined index
      const statsPromises = Object.values(INDICES).map(async (indexUid) => {
        try {
          console.log(`Getting stats for index: ${indexUid}`);
          const index = await client.index(indexUid);
          const stats = await index.getStats();
          console.log(`Stats for ${indexUid}:`, stats);
          return {
            [indexUid]: {
              numberOfDocuments: stats.numberOfDocuments,
              isIndexing: false,
            },
          };
        } catch (error) {
          console.error(`Error getting stats for index ${indexUid}:`, error);
          return {
            [indexUid]: {
              numberOfDocuments: 0,
              isIndexing: false,
              error: error instanceof Error ? error.message : String(error),
            },
          };
        }
      });

      // Combine all stats
      const statsResults = await Promise.all(statsPromises);
      indicesStats = Object.assign({}, ...statsResults);
      console.log("Final stats:", indicesStats);
    } catch (error) {
      console.error("Failed to get Meilisearch stats:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Stack trace:", error.stack);
      }
    }
  }

  return json({
    isConnected,
    sampleTasks,
    sampleUsers,
    sampleCharities,
    indicesStats,
    indices: INDICES,
    userInfo,
    zitUserInfo,
  });
}
