import { LoaderFunctionArgs, MetaFunction, redirect } from "react-router";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Solana Integration | Altruvist" },
    {
      name: "description",
      content: "Interact with the Altruvist Solana program",
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  if (!accessToken) {
    return redirect("/zitlogin");
  }

  const { userInfo } = await getUserInfo(accessToken);
  if (!userInfo) {
    return redirect("/zitlogin");
  }

  return {
    userInfo,
  };
}
