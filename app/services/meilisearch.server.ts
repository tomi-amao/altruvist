import { MeiliSearch } from "meilisearch";
import { getMeiliVars } from "./env.server";
import { users } from "@prisma/client";

// Get Meilisearch configuration from environment variables
const meiliVars = getMeiliVars();

// Initialize Meilisearch client
export const client = new MeiliSearch({
  host: meiliVars.MEILI_HOST,
  apiKey: meiliVars.MEILI_MASTER_KEY,
});

// Define the indices we'll be using
export const INDICES = {
  TASKS: "skillanthropy_tasks",
  USERS: "skillanthropy_users",
  CHARITIES: "skillanthropy_charities",
  TASK_APPLICATIONS: "skillanthropy_taskApplications",
} as const;

/**
 * Check if Meilisearch is connected and available
 */
export const isMeilisearchConnected = async (): Promise<boolean> => {
  try {
    await client.health();
    return true;
  } catch (error) {
    console.error("Meilisearch connection error:", error);
    return false;
  }
};

/**
 * Prepare document for Meilisearch by serializing complex data types
 * This is crucial for handling Date objects and nested objects
 */
export const prepareDocumentForMeilisearch = <T extends Record<string, any>>(
  doc: T,
): Record<string, any> => {
  const prepared: Record<string, any> = {};

  // Process each field in the document
  for (const [key, value] of Object.entries(doc)) {
    // Handle Date objects
    if (value instanceof Date) {
      prepared[key] = value.toISOString();
    }
    // Handle nested objects (but not arrays)
    else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      prepared[key] = JSON.stringify(value);
    }
    // Handle arrays of objects
    else if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "object" &&
      value[0] !== null
    ) {
      prepared[key] = JSON.stringify(value);
    }
    // Keep other values as they are
    else {
      prepared[key] = value;
    }
  }

  return prepared;
};

/**
 * Index a single document to Meilisearch
 */
export const indexDocument = async <T extends { id: string }>(
  indexName: string,
  document: T,
): Promise<boolean> => {
  try {
    const index = client.index(indexName);
    const preparedDoc = prepareDocumentForMeilisearch(document);

    await index.addDocuments([preparedDoc]);
    return true;
  } catch (error) {
    console.error(`Failed to index document in ${indexName}:`, error);
    console.error("Document that failed:", JSON.stringify(document, null, 2));
    return false;
  }
};

/**
 * Index multiple documents to Meilisearch
 */
export const indexDocuments = async <T extends { id: string }>(
  indexName: string,
  documents: T[],
): Promise<boolean> => {
  try {
    if (documents.length === 0) return true;

    // Prepare all documents for Meilisearch
    const preparedDocs = documents.map(prepareDocumentForMeilisearch);

    // Log first document for debugging
    console.log(
      `Preparing to index ${documents.length} documents to ${indexName}`,
    );
    console.log(
      "Sample document structure:",
      JSON.stringify(preparedDocs[0], null, 2),
    );

    const index = client.index(indexName);

    // Split into smaller batches to avoid potential payload size issues
    const batchSize = 100;
    for (let i = 0; i < preparedDocs.length; i += batchSize) {
      const batch = preparedDocs.slice(i, i + batchSize);
      await index.addDocuments(batch);
      console.log(
        `Indexed batch ${i / batchSize + 1}/${Math.ceil(preparedDocs.length / batchSize)}`,
      );
    }

    return true;
  } catch (error) {
    console.error(`Failed to index documents in ${indexName}:`, error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if (error.stack) console.error(error.stack);
    }
    return false;
  }
};

/**
 * Delete a document from an index by ID
 */
export const deleteDocument = async (
  indexName: string,
  documentId: string,
): Promise<boolean> => {
  try {
    const index = client.index(indexName);
    await index.deleteDocument(documentId);
    return true;
  } catch (error) {
    console.error(
      `Failed to delete document ${documentId} from ${indexName}:`,
      error,
    );
    return false;
  }
};

/**
 * Delete all documents from an index
 */
export const deleteAllDocuments = async (
  indexName: string,
): Promise<boolean> => {
  try {
    const index = client.index(indexName);
    await index.delete();
    return true;
  } catch (error) {
    console.error(`Failed to delete all documents from ${indexName}:`, error);
    return false;
  }
};

/**
 * Search across multiple indices (tasks, users, charities)
 */
export const searchMultipleIndices = async (query: string) => {
  try {
    const isConnected = await isMeilisearchConnected();
    if (!isConnected) {
      return {
        status: "error",
        message:
          "Search service is currently unavailable. Please try again later.",
        searchResult: null,
        searchedDocuments: [],
        rawSearchedDocuments: [],
      };
    }

    if (!query || query.trim() === "") {
      return {
        status: 200,
        searchResult: null,
        searchedDocuments: [],
        rawSearchedDocuments: [],
      };
    }

    // Perform searches across all indices in parallel
    const [tasksResults, usersResults, charitiesResults] = await Promise.all([
      client.index(INDICES.TASKS).search(query),
      client.index(INDICES.USERS).search(query),
      client.index(INDICES.CHARITIES).search(query),
    ]);

    // Format the results for easier consumption
    const tasksDocuments = tasksResults.hits.map((hit) => ({
      collection: INDICES.TASKS,
      data: hit,
    }));

    const usersDocuments = usersResults.hits.map((hit) => ({
      collection: INDICES.USERS,
      data: hit.roles && hit.roles[0] !== null ? hit : null, // filter out users with no roles
    })).filter(doc => doc.data !== null);

    const charitiesDocuments = charitiesResults.hits.map((hit) => ({
      collection: INDICES.CHARITIES,
      data: hit,
    }));

    // Combine all results
    const rawSearchedDocuments = [
      ...tasksDocuments,
      ...usersDocuments,
      ...charitiesDocuments,
    ];

    return {
      status: 200,
      searchResult: {
        tasks: tasksResults,
        users: usersResults,
        charities: charitiesResults,
      },
      searchedDocuments: rawSearchedDocuments,
      rawSearchedDocuments,
    };
  } catch (error) {
    console.error("Meilisearch multi-index search error:", error);
    return {
      status: 400,
      message: "An error occurred while searching. Please try again later.",
      searchResult: null,
      searchedDocuments: [],
      rawSearchedDocuments: [],
    };
  }
};

/**
 * Initialize Meilisearch indices with proper settings
 */
export const initializeMeilisearch = async () => {
  try {
    // Check if Meilisearch is available
    const isConnected = await isMeilisearchConnected();
    if (!isConnected) {
      console.error("Cannot initialize Meilisearch: service unavailable");
      throw new Error("Meilisearch service unavailable");
    }

    console.log("Creating and configuring Meilisearch indices...");

    // First, create all indices if they don't exist
    try {
      console.log("Creating indices if they don't exist...");
      await Promise.all([
        client.createIndex(INDICES.TASKS, { primaryKey: "id" }),
        client.createIndex(INDICES.USERS, { primaryKey: "id" }),
        client.createIndex(INDICES.CHARITIES, { primaryKey: "id" }),
        client.createIndex(INDICES.TASK_APPLICATIONS, { primaryKey: "id" }),
      ]);
    } catch (createError) {
      // Ignore errors if indices already exist
      console.log(
        "Some indices may already exist, continuing with configuration...",
      );
    }

    const taskApplicationsIndex = client.index(INDICES.TASK_APPLICATIONS);
    await taskApplicationsIndex.updateSettings({
      searchableAttributes: ["taskId", "userId", "status"],
      filterableAttributes: ["id", "taskId", "userId", "status"],
      sortableAttributes: ["createdAt", "updatedAt"],
    });
    console.log("Task applications index configured successfully");

    const tasksIndex = client.index(INDICES.TASKS);
    await tasksIndex.updateSettings({
      searchableAttributes: [
        "title",
        "description",
        "impact",
        "requiredSkills",
        "category",
        "deliverables",
        "location",
        "resources",
      ],
      filterableAttributes: [
        "id",
        "category",
        "requiredSkills",
        "urgency",
        "status",
        "charityId",
        "userId",
        "location",
        "estimatedHours",
        "volunteersNeeded",
      ],
      sortableAttributes: [
        "deadline",
        "createdAt",
        "updatedAt",
        "estimatedHours",
        "volunteersNeeded",
      ],
    });
    console.log("Tasks index configured successfully");

    // Configure users index
    console.log("Configuring users index...");
    const usersIndex = client.index(INDICES.USERS);
    await usersIndex.updateSettings({
      searchableAttributes: [
        "name",
        "email",
        "skills",
        "bio",
        "userTitle",
        "preferredCharities",
      ],
      filterableAttributes: [
        "id",
        "skills",
        "roles",
        "permissions",
        "charityId",
        "preferredCharities",
        "zitadelId",
      ],
      sortableAttributes: ["createdAt", "updatedAt"],
    });
    console.log("Users index configured successfully");

    // Configure charities index
    console.log("Configuring charities index...");
    const charitiesIndex = client.index(INDICES.CHARITIES);
    await charitiesIndex.updateSettings({
      searchableAttributes: [
        "name",
        "description",
        "website",
        "contactPerson",
        "contactEmail",
        "tags",
      ],
      filterableAttributes: ["id", "tags"],
      sortableAttributes: ["createdAt", "updatedAt"],
    });
    console.log("Charities index configured successfully");
    console.log("Meilisearch indices initialization completed successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Meilisearch indices:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
};
