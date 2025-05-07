import { redirect, type ActionFunctionArgs } from "react-router";
import { getUserInfo } from "~/models/user2.server";
import { prisma } from "~/services/db.server";
import {
  indexDocuments,
  deleteDocument,
  searchMultipleIndices,
  initializeMeilisearch,
  isMeilisearchConnected,
  INDICES,
  deleteAllDocuments,
} from "~/services/meilisearch.server";
import { getSession } from "~/services/session.server";

export async function action({ request }: ActionFunctionArgs) {
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

  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "initialize": {
        try {
          // First check if Meilisearch is connected
          const isConnected = await isMeilisearchConnected();
          if (!isConnected) {
            return {
              success: false,
              message:
                "Failed to initialize indices: Meilisearch is not connected",
              errorDetails: "Connection to Meilisearch failed",
              action,
            };
          }

          // If connected, try to initialize
          console.log("Starting Meilisearch initialization...");
          await initializeMeilisearch();

          return {
            success: true,
            message: "Meilisearch indices initialized successfully",
            action,
          };
        } catch (initError) {
          console.error("Error during Meilisearch initialization:", initError);
          return {
            success: false,
            message: "Failed to initialize indices",
            errorDetails:
              initError instanceof Error
                ? initError.message
                : String(initError),
            action,
          };
        }
      }

      case "delete-document": {
        const indexName = formData.get("indexName") as string;
        const docId = formData.get("docId") as string;

        if (!indexName || !docId) {
          return {
            success: false,
            message: "Index name and document ID are required",
            action,
          };
        }

        const result = await deleteDocument(indexName, docId);
        return {
          success: result,
          message: result
            ? "Document deleted successfully"
            : "Failed to delete document",
          action,
        };
      }

      case "delete-all-documents": {
        const indexName = formData.get("indexName") as string;

        if (!indexName) {
          return {
            success: false,
            message: "Index name is required",
            action,
          };
        }

        const result = await deleteAllDocuments(indexName);
        return {
          success: result,
          message: result
            ? "All documents deleted successfully"
            : "Failed to delete documents",
          action,
        };
      }

      case "search-all": {
        const query = formData.get("query") as string;

        if (!query) {
          return { success: false, message: "Query is required", action };
        }

        const result = await searchMultipleIndices(query);

        return {
          success: result.status === 200,
          message: result.status === 200 ? "Search completed" : result.message,
          result: result,
          action,
        };
      }

      case "sync-all": {
        try {
          await initializeMeilisearch();

          //sync task applications
          console.log("Starting task application sync...");
          const taskApplications = await prisma.taskApplications.findMany({
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  charity: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  skills: true,
                  bio: true,
                  roles: true,
                  zitadelId: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          });

          console.log(
            `Found ${taskApplications.length} task applications to sync`,
          );
          const taskApplicationsResult = await indexDocuments(
            INDICES.TASK_APPLICATIONS,
            taskApplications,
          );

          // Sync tasks
          console.log("Starting task sync...");
          const tasks = await prisma.tasks.findMany({
            include: {
              charity: {
                select: {
                  id: true,
                  name: true,
                },
              },
              taskApplications: {
                select: {
                  id: true,
                  userId: true,
                  status: true,
                  message: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          console.log(`Found ${tasks.length} tasks to sync`);

          if (tasks.length === 0) {
            console.log("No tasks found in MongoDB");
            return {
              success: false,
              message: "No tasks found to sync",
              action,
            };
          }

          // Process tasks for Meilisearch

          // Index tasks in smaller batches
          const batchSize = 50;
          let tasksResult = true;

          for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize);
            console.log(
              `Processing batch ${i / batchSize + 1} of ${Math.ceil(tasks.length / batchSize)}`,
            );

            try {
              const batchResult = await indexDocuments(INDICES.TASKS, batch);
              if (!batchResult) {
                console.error(`Failed to index batch ${i / batchSize + 1}`);
                tasksResult = false;
                break;
              }
            } catch (error) {
              console.error(
                `Error indexing batch ${i / batchSize + 1}:`,
                error,
              );
              tasksResult = false;
              break;
            }
          }

          console.log("Tasks sync result:", tasksResult);

          // Sync users
          const users = await prisma.users.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              skills: true,
              bio: true,
              roles: true,
              zitadelId: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          // Process users for Meilisearch
          const processedUsers = users.map((user) => {
            return {
              ...user,
              createdAt: user.createdAt ? user.createdAt.toISOString() : null,
              updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
              skills: user.skills || [],
              roles: user.roles || [],
            };
          });

          const usersResult = await indexDocuments(
            INDICES.USERS,
            processedUsers,
          );

          // Sync charities
          const charities = await prisma.charities.findMany();

          // Process charities for Meilisearch
          const processedCharities = charities.map((charity) => {
            return {
              ...charity,
              createdAt: charity.createdAt
                ? charity.createdAt.toISOString()
                : null,
              updatedAt: charity.updatedAt
                ? charity.updatedAt.toISOString()
                : null,
            };
          });

          const charitiesResult = await indexDocuments(
            INDICES.CHARITIES,
            processedCharities,
          );

          const success =
            tasksResult &&
            usersResult &&
            charitiesResult &&
            taskApplicationsResult;

          return {
            success: success,
            message: success
              ? "All data synchronized successfully"
              : "Some synchronization operations failed",
            details: {
              tasks: { count: tasks.length, success: tasksResult },
              users: { count: users.length, success: usersResult },
              charities: { count: charities.length, success: charitiesResult },
              taskApplications: {
                count: taskApplications.length,
                success: taskApplicationsResult,
              },
            },
            action,
          };
        } catch (error) {
          console.error("Error in sync-all action:", error);
          return {
            success: false,
            message: "Failed to sync data",
            error: error instanceof Error ? error.message : String(error),
            action,
          };
        }
      }

      default:
        return { success: false, message: "Unknown action", action };
    }
  } catch (error) {
    console.error("Error in search-test action:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
      error: String(error),
      action,
    };
  }
}
