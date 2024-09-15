import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getZitadelVars } from "~/services/env.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken"); //retrieve access token from session to be used as bearer token
  const zitadel = getZitadelVars();

  if (!accessToken) {
    return redirect("/login");
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

    const userInfo = await userInfoResponse.json();

    return json({ userInfo, error: null });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return json(
      { error: "Failed to fetch user info", userInfo: null },
      { status: 500 },
    );
  }
}

export default function Dashboard() {
  const { userInfo, error } = useLoaderData<typeof loader>();

  if (error) {
    return <div className="text-darkRed">Error: {error}</div>;
  }

  return (
    <div className="text-jade9">
      <h1>Dashboard</h1>
      <h2>Welcome, {userInfo.name}!</h2>
      <p>Email: {userInfo.email}</p>
      <pre>{JSON.stringify(userInfo, null, 2)}</pre>
      <Link to={"/zitlogout"}>
        <button> Logout </button>
      </Link>
    </div>
  );
}
