import { prisma } from "~/services/db.server";

import { getSession } from "~/services/session.server";
import { getZitadelVars } from "~/services/env.server";
import type { GetUserResponse, zitadelUserInfo } from "~/types/zitadelUser";

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

export const getUserInfo = async (accessToken: string) => {
  const zitadel = getZitadelVars();

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
    });
    return { userInfo, error: null, zitUserInfo };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return {
      error: `Failed to fetch user info: ${error}`,
      userInfo: null,
      zitUserInfo: null,
    };
  }
};

export const updateUserInfo = async (userId: string, role: string) => {


  try {

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    if (!user) {
      return {message: "No user Found"}
    }
    if (user.roles.includes(role)) {
      return { message: "Role already exists",  status: 400 }
    }
    const updatedUserInfo = await prisma.users.update({
      where: { id: userId },
      data: { roles: { push: role } },
    });

    return { updatedUserInfo, status: 200, error: null };
  } catch (error) {
    console.error(error);
    return { updatedUserInfo: null, status: 500, error: null };
  }
};
