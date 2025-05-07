import { type LoaderFunctionArgs, redirect } from "react-router";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const { userInfo, zitUserInfo } = await getUserInfo(accessToken);

  if (!userInfo) {
    return redirect("/zitlogin");
  }

  const roles = zitUserInfo?.["urn:zitadel:iam:org:project:roles"] as Record<
    string,
    unknown
  >;
  const role = roles ? Object.keys(roles).join(", ") : "User";

  console.log("Role:", role);

  if (role !== "admin") {
    throw new Error("You are not authorized to access this page");
  }

  return { userInfo, role };
}
