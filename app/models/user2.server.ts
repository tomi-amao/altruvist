import { prisma } from "~/services/db.server";

import { getZitadelVars } from "~/services/env.server";
import type { zitadelUserInfo } from "~/types/zitadelUser";
import type { Prisma } from "@prisma/client";
import { ObjectIdSchema } from "~/services/validators.server";

// create a mongodb user document if user from zitadel directory does not exist
export const createUser = async (user: zitadelUserInfo) => {
  // check if email inputted by user exists
  const userExists = await prisma.users.count({
    where: { zitadelId: user.sub },
  });

  if (userExists === 1) {
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
    return { userInfo, error: null, zitUserInfo };
  } catch (error) {
    return {
      error: `Failed to fetch user info: ${error}`,
      userInfo: null,
      zitUserInfo: null,
    };
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
    const role = updateUserData.roles;
    console.log(role, typeof role);

    // if (user.roles.includes(role)) {
    //   return { message: "Role already exists", status: 400 };
    // }
    const updatedUserInfo = await prisma.users.update({
      where: { id: userId },
      data: updateUserData,
    });

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
  const objectIdValidation = ObjectIdSchema.safeParse(userId);
  if (!objectIdValidation.success) {
    throw new Error("Invalid user ID");
  }

  const profile = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      charity: true,
    },
  });

  return profile;
};
