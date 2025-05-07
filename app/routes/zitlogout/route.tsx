import { data, LoaderFunctionArgs, redirect } from "react-router";
import { getZitadelVars } from "~/services/env.server";
import { destroySession, getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const idToken = session.get("idToken");

  const zitadel = getZitadelVars();

  try {
    const logoutUrl = new URL(`${zitadel.ZITADEL_DOMAIN}/oidc/v1/end_session`);
    logoutUrl.searchParams.append("id_token_hint", idToken!);
    logoutUrl.searchParams.append(
      "post_logout_redirect_uri",
      zitadel.LOGOUT_URI,
    );
    logoutUrl.searchParams.append("state", zitadel.STATE); // unique string to prevent CSRF
    return redirect(logoutUrl.toString(), {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return data(
      { error: "Failed to fetch user info", userInfo: null },
      { status: 500 },
    );
  }
}
