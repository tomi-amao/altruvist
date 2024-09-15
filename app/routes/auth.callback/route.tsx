import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createUser } from "~/models/user2.server";
import { getZitadelVars } from "~/services/env.server";
import { getSession, commitSession } from "~/services/session.server";
import { zitadelUserInfo } from "~/types/zitadelUser";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code"); // zitadel redirects to call back with a search param including the code
  const session = await getSession(request);
  const zitadel = getZitadelVars();

  const codeVerifier = session.get("codeVerifier");

  if (!code || !codeVerifier) {
    session.flash("error", "Invalid authentication response");
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  try {
    // Exchange the code for tokens
    const tokenResponse = await fetch(
      `${zitadel.ZITADEL_DOMAIN}/oauth/v2/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: zitadel.CLIENT_ID,
          code,
          redirect_uri: zitadel.REDIRECT_URI,
          code_verifier: codeVerifier,
        }),
      },
    );
    // console.log("Token response", await tokenResponse.json());
    // console.log("response ok?", tokenResponse.ok);

    // if (!tokenResponse.ok) {
    //   throw new Error("Failed to exchange code for tokens");
    // }

    // console.log("Token response status:", tokenResponse.status);
    // console.log("Token response status text:", tokenResponse.statusText);
    // console.log("Token response text:", await tokenResponse.text());
    // console.log("Token response headers:", tokenResponse.headers);
    // console.log("Token response ok?:", tokenResponse.ok);

    const { access_token, id_token } = await tokenResponse.json();

    // Store the tokens in the session
    session.set("accessToken", access_token);
    session.set("idToken", id_token);
    session.unset("codeVerifier");

    // create new mongodb user if none exists upon login
    const userInfoResponse = await fetch(
      `${zitadel.ZITADEL_DOMAIN}/oidc/v1/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const userInfo: zitadelUserInfo = await userInfoResponse.json();
    const newUser = await createUser(userInfo);
    console.log("Mongodb user", newUser);

    // if new user, redirect to new user set up journey
    if (newUser.status === 200) {
      return redirect("/newuser", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
    return redirect("/dashboard", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    console.error("Error during token exchange:", error);
    session.flash("error", "Failed to complete login");
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
}

export default function Callback() {
  return <div>Processing login...</div>;
}
