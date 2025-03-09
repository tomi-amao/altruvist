import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/services/db.server";
import {
  indexDocument,
  indexDocuments,
  deleteDocument,
  searchUserTaskApplications,
  searchMultipleIndices,
  initializeMeilisearch,
  isMeilisearchConnected,
  INDICES,
  deleteAllDocuments,
} from "~/services/meilisearch.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "initialize": {
        try {
          // First check if Meilisearch is connected
          const isConnected = await isMeilisearchConnected();
          if (!isConnected) {
            return json({
              success: false,
              message: "Failed to initialize indices: Meilisearch is not connected",
              errorDetails: "Connection to Meilisearch failed",
              action,
            });
          }

          // If connected, try to initialize
          console.log("Starting Meilisearch initialization...");
          await initializeMeilisearch();
          
          return json({
            success: true,
            message: "Meilisearch indices initialized successfully",
            action,
          });
        } catch (initError) {
          console.error("Error during Meilisearch initialization:", initError);
          return json({
            success: false,
            message: "Failed to initialize indices",
            errorDetails: initError instanceof Error ? initError.message : String(initError),
            action,
          });
        }
      }

      case "index-task": {
        const taskId = formData.get("taskId") as string;
        if (!taskId)
          return json({
            success: false,
            message: "No task ID provided",
            action,
          });

        const task = await prisma.tasks.findUnique({
          where: { id: taskId },
          include: {
            charity: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
        });

        if (!task)
          return json({ success: false, message: "Task not found", action });

        const result = await indexDocument(INDICES.TASKS, task);
        return json({
          success: result,
          message: result
            ? "Task indexed successfully"
            : "Failed to index task",
          action,
        });
      }

      case "index-user": {
        const userId = formData.get("userId") as string;
        if (!userId)
          return json({
            success: false,
            message: "No user ID provided",
            action,
          });

        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            skills: true,
            bio: true,
          },
        });

        if (!user)
          return json({ success: false, message: "User not found", action });

        const result = await indexDocument(INDICES.USERS, user);
        return json({
          success: result,
          message: result
            ? "User indexed successfully"
            : "Failed to index user",
          action,
        });
      }

      case "index-charity": {
        const charityId = formData.get("charityId") as string;
        if (!charityId)
          return json({
            success: false,
            message: "No charity ID provided",
            action,
          });

        const charity = await prisma.charities.findUnique({
          where: { id: charityId },
        });
        if (!charity)
          return json({ success: false, message: "Charity not found", action });

        const result = await indexDocument(INDICES.CHARITIES, charity);
        return json({
          success: result,
          message: result
            ? "Charity indexed successfully"
            : "Failed to index charity",
          action,
        });
      }

      case "delete-document": {
        const indexName = formData.get("indexName") as string;
        const docId = formData.get("docId") as string;

        if (!indexName || !docId) {
          return json({
            success: false,
            message: "Index name and document ID are required",
            action,
          });
        }

        const result = await deleteDocument(indexName, docId);
        return json({
          success: result,
          message: result
            ? "Document deleted successfully"
            : "Failed to delete document",
          action,
        });
      }

      case "delete-all-documents": {
        const indexName = formData.get("indexName") as string;

        if (!indexName) {
          return json({
            success: false,
            message: "Index name is required",
            action,
          });
        }

        const result = await deleteAllDocuments(indexName);
        return json({
          success: result,
          message: result
            ? "All documents deleted successfully"
            : "Failed to delete documents",
          action,
        });
      }

      case "search-tasks": {
        const query = formData.get("query") as string;
        const taskIdsString = formData.get("taskIds") as string;

        if (!query || !taskIdsString) {
          return json({
            success: false,
            message: "Query and task IDs are required",
            action,
          });
        }

        const taskIds = taskIdsString.split(",").map((id) => id.trim());
        const result = await searchUserTaskApplications(query, taskIds);

        return json({
          success: result.status === 200,
          message: result.status === 200 ? "Search completed" : result.message,
          result: result,
          action,
        });
      }

      case "search-all": {
        const query = formData.get("query") as string;

        if (!query) {
          return json({ success: false, message: "Query is required", action });
        }

        const result = await searchMultipleIndices(query);

        return json({
          success: result.status === 200,
          message: result.status === 200 ? "Search completed" : result.message,
          result: result,
          action,
        });
      }

      case "sync-all": {
        try {
          await initializeMeilisearch();

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
            return json({
              success: false,
              message: "No tasks found to sync",
              action,
            });
          }

          // Process tasks for Meilisearch
          


          // Index tasks in smaller batches
          const batchSize = 50;
          let tasksResult = true;

          for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize);
            console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(tasks.length / batchSize)}`);
            
            try {
              const batchResult = await indexDocuments(INDICES.TASKS, batch);
              if (!batchResult) {
                console.error(`Failed to index batch ${i / batchSize + 1}`);
                tasksResult = false;
                break;
              }
            } catch (error) {
              console.error(`Error indexing batch ${i / batchSize + 1}:`, error);
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
              charityId: true,
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

          const success = tasksResult && usersResult && charitiesResult;

          return json({
            success: success,
            message: success
              ? "All data synchronized successfully"
              : "Some synchronization operations failed",
            details: {
              tasks: { count: tasks.length, success: tasksResult },
              users: { count: users.length, success: usersResult },
              charities: { count: charities.length, success: charitiesResult },
            },
            action,
          });
        } catch (error) {
          console.error("Error in sync-all action:", error);
          return json(
            {
              success: false,
              message: "Failed to sync data",
              error: error instanceof Error ? error.message : String(error),
              action,
            },
            { status: 500 },
          );
        }
      }

      default:
        return json(
          { success: false, message: "Unknown action", action },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in search-test action:", error);
    return json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
        error: String(error),
        action,
      },
      { status: 500 },
    );
  }
}
