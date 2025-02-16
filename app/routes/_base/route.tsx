import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";

import Navbar from "~/components/navigation/Header2";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  const { userInfo } = await getUserInfo(accessToken);

  return { userInfo };
}

export default function BaseTemplate() {
  const { userInfo } = useLoaderData<typeof loader>();
  return (
    <>
      <Navbar userId={userInfo?.id} />

      <div className="m-auto lg:w-9/12  w-full py-4 px-2 ">
        <h1 className="mt-16"> </h1>

        <Outlet />
      </div>
    </>
  );
}
