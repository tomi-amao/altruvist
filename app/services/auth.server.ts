import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";

import { FormStrategy } from "remix-auth-form";
import { verifyLogin } from "~/models/user.server";

export const authenticator = new Authenticator(sessionStorage, {
  sessionKey: "userId",
  sessionErrorKey: "error",
});

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = form.get("email")!.toString();
    const password = form.get("password")!.toString();

    const user = await verifyLogin(email, password);

    return user;
  }),
  "user-pass",
);
