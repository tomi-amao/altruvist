import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getZitadelVars } from "~/services/env.server";
import { getSession, commitSession } from "~/services/session.server";

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
