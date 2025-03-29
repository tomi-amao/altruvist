import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getZitadelVars } from "~/services/env.server";
import { generateCodeChallenge, generateCodeVerifier } from "~/services/pkce";
import { getSession, commitSession } from "~/services/session.server";
import https from "https";
import fetch from "node-fetch";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);

  const zitadel = getZitadelVars();

  if (!zitadel.CLIENT_ID || !zitadel.REDIRECT_URI || !zitadel.ZITADEL_DOMAIN) {
    session.flash("error", "Missing Zitadel configuration");
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
  // const agent = new https.Agent({
  //   rejectUnauthorized: false, // Disable SSL verification
  // });
  try {
    const response = await fetch(zitadel.ZITADEL_DOMAIN, {
      method: "GET",
      // agent,
    });

    if (!response.ok) {
      session.flash("error", "Server error during authentication");
      return redirect("/", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
  } catch (err) {
    console.log(err);

    session.flash("error", "Server error during authentication");
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  session.set("codeVerifier", codeVerifier); //set code verifier to session to be used in callback
  await commitSession(session);

  const authUrl = new URL(`${zitadel.ZITADEL_DOMAIN}/oauth/v2/authorize`);
  authUrl.searchParams.append("client_id", zitadel.CLIENT_ID);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", zitadel.REDIRECT_URI);
  authUrl.searchParams.append(
    "scope",
    "openid profile email offline_access urn:zitadel:iam:org:project:roles ",
  );
  authUrl.searchParams.append("code_challenge", codeChallenge);
  authUrl.searchParams.append("code_challenge_method", "S256");

  // window.location.href = authUrl.toString(); //navigate to zitadel hosted login page

  return redirect(authUrl.toString(), {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}
