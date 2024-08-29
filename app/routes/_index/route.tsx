import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getZitadelVars } from "~/services/env.server";
import { generateCodeChallenge, generateCodeVerifier } from "~/services/pkce";
import { getSession, commitSession } from "~/services/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Skillanthropy" },
    { name: "description", content: "Welcome to Skillanthropy!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const error = session.get("error");
  const zitadel = getZitadelVars();

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  if (!zitadel.CLIENT_ID || !zitadel.REDIRECT_URI || !zitadel.ZITADEL_DOMAIN) {
    return json(
      {
        error: "Missing Zitadel configuration",
        codeChallenge: "",
        zitadel: { ZITADEL_DOMAIN: "", CLIENT_ID: "", REDIRECT_URI: "" },
      },
      { status: 400 },
    );
  }

  session.set("codeVerifier", codeVerifier); //set code verifier to session to be used in callback

  return json(
    { error, codeChallenge, zitadel },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
  );
}

export default function Login() {
  const { error, codeChallenge, zitadel } = useLoaderData<typeof loader>();

  const handleLogin = () => {
    const authUrl = new URL(`${zitadel.ZITADEL_DOMAIN}/oauth/v2/authorize`);
    authUrl.searchParams.append("client_id", zitadel.CLIENT_ID);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", zitadel.REDIRECT_URI);
    authUrl.searchParams.append(
      "scope",
      "openid profile email urn:zitadel:iam:user:metadata",
    );
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");
    window.location.href = authUrl.toString(); //navigate to zitadel hosted login page
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleLogin} className="text-jade3">
        Login with Zitadel
      </button>
    </div>
  );
}
