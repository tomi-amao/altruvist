import { prisma } from "~/services/db.server";

import type { Profile } from "@prisma/client";
import { json } from "@remix-run/node";

export type { User } from "@prisma/client";
import argon2 from "argon2";
import { RegisterForm } from "./types.server";
import { getSession, sessionStorage } from "~/services/session.server";
import { authenticator } from "~/services/auth.server";
import { Prisma } from "@prisma/client";

export const getUserById = async (userId: string, query: Prisma.UserSelect) => {
  if (!userId) {
    console.log("No user id found");
    
  }
  
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { ...query },
  });
};

export const deleteUser = async (id: string) => {
  await prisma.user.delete({ where: { id } });
};

export const updateUser = async (userId: string, profile: Partial<Profile>) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profile: {
        update: profile,
      },
    },
  });
  return json({ message: "Successfully updated user" }, { status: 200 });
};

export const getUserByEmail = () => {};

export const deleteUserByEmail = () => {};

//function creating a user
export const createUser = async (user: RegisterForm) => {
    // hashes the password provided in the registration
    const passwordHash = await argon2.hash(user.password);
    // store the new User document using Prisma.
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        password: passwordHash,
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
    });
    // return the id and email of the new user.
    console.log("New User successfully created");

    return { id: newUser.id, email: user.email };

};

// function registering and logging in a user
export const register = async (
  user: RegisterForm,
  request: Request,
  formData: FormData
) => {
  // check if email inputted by user exists
  const userExists = await prisma.user.count({ where: { email: user.email } });

  if (userExists === 1) {
    return json(
      { error: "User already exists with that email" },
      { status: 400 }
    );
  }

  // create user based on form input
  const newUser = await createUser(user);

  if (!newUser) {
    return json(
      {
        error: "Something went wrong trying to create a user",
        fields: { email: user.email, password: user.password },
      },
      { status: 400 }
    );
  }
  // create a session based on user input
  const session = await createUserSession(request, formData);
  return json(
    {
      message: "Successfully created user",
    },
    { status: 200, headers: session }
  );
};

// check user inputted credentials
export const verifyLogin = async (email: string, password: string) => {
  // query for a user with a matching email.
    const user = await prisma.user.findUnique({ where: { email: email } });

    const verifyPassword = await argon2.verify(user!.password, password);

    if (!user || !verifyPassword) {
      throw new Error("Incorrect Login");
    }

    return { user };

};

// create user session based on request and user input
export const createUserSession = async (
  request: Request,
  formData: FormData
) => {
  // create a session with a cookie, handled by remix-auth
  const user = await authenticator.authenticate("user-pass", request, {
    failureRedirect: "/login",
    // use parsed in formData as context instead of calling request again to retrieve form data
    context: { formData },
  });
  // retrieve the current session
  const session = await getSession(request);

  session.set(authenticator.sessionKey, user.user.id);
  // create new header with committed session cookie
  const headers = new Headers({
    "Set-Cookie": await sessionStorage.commitSession(session),
  });

  return headers;
};

export const requireUserId = async (
  request: Request,
) => {
  const session = await getSession(request);
  const userId = session.get("userId")?.toString();
  
  return userId;
};

export const authError = async (
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) => {
  const session = await getSession(request);
  const authError = session.get("error");
  console.log(redirectTo);
  
  return authError;
};

export const logout = async (request: Request) => {
  console.log("successfully signed out");

  await authenticator.logout(request, { redirectTo: "/login" });
};

export const getOtherUser = (userId: string) => {
  return prisma.user.findMany({
    where: { id: { not: userId } },
    orderBy: { profile: { firstName: "asc" } },
  });
};
