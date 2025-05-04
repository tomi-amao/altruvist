import { prisma } from "~/services/db.server";
import { getZitadelVars } from "~/services/env.server";
import type { zitadelUserInfo } from "~/types/zitadelUser";
import type { Prisma } from "@prisma/client";
import { ObjectIdSchema } from "~/services/validators.server";
import https from "https";
import fetch from "node-fetch";
import {
  INDICES,
  indexDocument,
  deleteDocument,
  isMeilisearchConnected,
} from "~/services/meilisearch.server";
import { createNovuSubscriber } from "~/services/novu.server";
import { getCharityMemberships } from "./charities.server";

// create a mongodb user document if user from zitadel directory does not exist
export const createUser = async (user: zitadelUserInfo) => {
  // check if email inputted by user exists
  const userExists = await prisma.users.count({
    where: { zitadelId: user.sub },
  });

  if (userExists === 1) {
    const existingUserInfo = await prisma.users.findUnique({
      where: { zitadelId: user.sub },
    });
    console.log("User already exists", existingUserInfo);
    // await createNovuSubscriber(existingUserInfo);

    return {
      newUser: null,
      error: null,
      status: 202,
      statusText: "user exists",
    };
  }
  try {
    const newUser = await prisma.users.create({
      data: {
        zitadelId: user.sub,
        email: user.email,
        name: user.name,
        locale: user.locale,
      },
    });

    // Index the new user in Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await indexDocument(INDICES.USERS, newUser);
    }

    await createNovuSubscriber(newUser, false);

    return {
      newUser,
      error: null,
      status: 200,
      statusText: "New user successfully created",
    };
  } catch (error) {
    return {
      newUser: null,
      error,
      status: 404,
      statusText: "Unable to create new user",
    };
  }
};

export const getUserInfo = async (
  accessToken: string,
  include?: Prisma.usersInclude,
) => {
  const zitadel = getZitadelVars();

  if (!accessToken) {
    console.log("No access token provided");
    return {
      error: "No access token provided",
      userInfo: null,
      zitUserInfo: null,
    };
  }

  try {
    const userInfoResponse = await fetch(
      `${zitadel.ZITADEL_DOMAIN}/oidc/v1/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        agent: zitadel.DISABLE_SSL_VERIFICATION 
          ? new https.Agent({ rejectUnauthorized: false }) 
          : undefined,
      },
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const zitUserInfo: zitadelUserInfo = await userInfoResponse.json();

    const userInfo = await prisma.users.findFirst({
      where: { zitadelId: zitUserInfo.sub },
      ...(include && { include }),
    });

    const charityMemberships = await getCharityMemberships({
      userId: userInfo?.id,
    });
    return { userInfo, charityMemberships, error: null, zitUserInfo };
  } catch (error) {
    return {
      error: `Failed to fetch user info: ${error}`,
      userInfo: null,
      zitUserInfo: null,
      charityMemberships: null,
    };
  }
};

export const getUserById = async (userId: string) => {
  console.log("User ID acs:", userId);

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });
    return { user };
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw new Error("Failed to fetch user");
  }
};

export const updateUserInfo = async (
  userId: string,
  updateUserData: Prisma.usersUpdateInput,
) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    if (!user) {
      return { message: "No user Found" };
    }

    const updatedUserInfo = await prisma.users.update({
      where: { id: userId },
      data: updateUserData,
    });

    // Update the user in Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await indexDocument(INDICES.USERS, updatedUserInfo);
    }

    return { updatedUserInfo, status: 200, error: null };
  } catch (error) {
    console.error(error);
    return { updatedUserInfo: null, status: 500, error: null };
  }
};

export const listUsers = async (userIds: string[]) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      console.warn("Invalid or empty userIds array");
      return [];
    }

    const users = await prisma.users.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });

    if (users.length < userIds.length) {
      console.warn(
        `Some users were not found. Requested: ${userIds.length}, Found: ${users.length}`,
      );
    }

    return users;
  } catch (error) {
    console.error("Error in listUsers:", error);
    throw new Error("Failed to fetch users");
  }
};

export const deleteUser = async (id: string, zitId: string) => {
  const { ZITADEL_ADMIN_TOKEN, ZITADEL_DOMAIN } = getZitadelVars();
  try {
    await prisma.users.delete({ where: { id } });

    // Delete the user from Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await deleteDocument(INDICES.USERS, id);
    }

    let myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${ZITADEL_ADMIN_TOKEN}`);

    let requestOptions = {
      method: "DELETE",
      headers: myHeaders,
      redirect: "follow" as RequestRedirect,
    };

    fetch(`${ZITADEL_DOMAIN}/v2/users/${zitId}`, requestOptions)
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));
    return { message: "Successfully deleted user", status: 200 };
  } catch (error) {
    console.log(error);

    return { message: "Failed to delete user", status: 500 };
  }
};

export const getProfileInfo = async (userId: string) => {
  try {
    if (!userId) {
      return {
        profile: null,
        error: "User ID is required",
        charityMemberships: null,
      };
    }

    const isValidId = ObjectIdSchema.safeParse(userId);
    if (!isValidId.success) {
      return {
        profile: null,
        error: "Invalid user ID format",
        charityMemberships: null,
      };
    }

    const profile = await prisma.users.findUnique({
      where: { id: userId },
    });

    // Get charity memberships for this user
    const charityMemberships = await prisma.charityMemberships.findMany({
      where: { userId },
      include: {
        charity: true,
      },
    });

    if (!profile) {
      return {
        profile: null,
        error: "User not found",
        charityMemberships: { memberships: [] },
      };
    }

    return {
      profile,
      error: null,
      charityMemberships: {
        memberships: charityMemberships,
        message: "Charity memberships found",
        status: 200,
      },
    };
  } catch (error) {
    return {
      profile: null,
      error: `Error fetching profile: ${error}`,
      charityMemberships: {
        memberships: [],
        status: 500,
        message: "Error fetching memberships",
      },
    };
  }
};

// Function to fetch user's task applications by userId
export async function getUserTaskApplications(userId: string) {
  try {
    // Ensure we have a valid userId
    if (!userId) {
      return { error: "User ID is required", taskApplications: [] };
    }

    // Query the database for the user's task applications
    const taskApplications = await prisma.taskApplications.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc", // Sort by most recent first
      },
    });

    if (taskApplications.length === 0) {
      console.warn("No task applications found for user:", userId);
    }

    return { taskApplications };
  } catch (error) {
    console.error("Error fetching user task applications:", error);
    return { error: "Failed to fetch task applications", taskApplications: [] };
  }
}
