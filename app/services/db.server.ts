import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
declare global {
  var __db: PrismaClient | undefined;
}

/**
 * Display a detailed error message for MongoDB connection issues
 * focusing on IP allowlist problems
 */
function displayMongoConnectionError(error: unknown) {
  const errorMsg = error instanceof Error ? error.message : String(error);

  if (
    errorMsg.includes("Server selection timeout") ||
    errorMsg.includes("received fatal alert: InternalError") ||
    errorMsg.includes("NetworkingError")
  ) {
    console.error("\n\n================================");
    console.error("MongoDB CONNECTION ERROR");
    console.error("Most likely causes:");
    console.error(
      "1. Your current IP address is not in MongoDB Atlas allowlist",
    );
    console.error("2. MongoDB Atlas cluster is down or being maintained");
    console.error("3. Your DATABASE_URL environment variable is incorrect");
    console.error("\nAction required:");
    console.error(
      "- Add your current IP address to MongoDB Atlas: https://cloud.mongodb.com > Network Access > Add IP Address",
    );
    console.error("- Check your DATABASE_URL environment variable");
    console.error("================================\n\n");

    return true;
  }
  return false;
}

// Create PrismaClient with proper error handling configuration
const createPrismaClient = () => {
  return new PrismaClient({
    log: [
      { emit: "stdout", level: "error" },
      { emit: "stdout", level: "warn" },
    ],
    errorFormat: "pretty",
  });
};

// Try to establish the database connection
const connectDb = async (client: PrismaClient) => {
  try {
    // Note: $connect just establishes a connection to the MongoDB server
    // but doesn't actually test if we can query data from databases/collections
    await client.$connect();

    // Perform a simple test query to verify we have proper access
    try {
      // Attempt a lightweight query just to validate we have true data access
      // This query will throw if there are IP allowlist issues
      await client.$runCommandRaw({ ping: 1 });
      console.log(
        "Successfully connected to MongoDB with verified data access",
      );
      return client;
    } catch (queryError) {
      console.error(
        "Connected to MongoDB server but failed to access data:",
        queryError,
      );
      displayMongoConnectionError(queryError);
      return client; // Still return client for app to continue
    }
  } catch (connectionError) {
    console.error("Failed to connect to MongoDB:", connectionError);
    displayMongoConnectionError(connectionError);
    return client; // Still return client, but connection won't be established
  }
};

// Initialize the Prisma client based on environment
if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
  connectDb(prisma).catch((e) =>
    console.error("Production database connection error:", e),
  );
} else {
  if (!global.__db) {
    global.__db = createPrismaClient();
    connectDb(global.__db).catch((e) =>
      console.error("Development database connection error:", e),
    );
  }
  prisma = global.__db;
}



export { prisma };
