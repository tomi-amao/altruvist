import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  redirect,
  useLoaderData,
} from "@remix-run/react";
import type {
  ActionFunctionArgs,
  LinksFunction,
} from "@remix-run/node";
import stylesheet from "~/styles/tailwind.css?url";

import darkModeSet, { getDarkMode } from "./data/darkmode";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesheet }];
};

export function Layout({ children }: { children: React.ReactNode }) {
  const mode = useLoaderData();
  console.log("Darkmode:", mode);

  return (
    <html lang="en" className={mode === "true" ? "" : "dark"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-mauve2 dark:bg-bgprimary">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const darkToggle = Object.fromEntries(formData);
  const mode = Boolean(darkToggle.darkToggle);
  // console.log(darkToggle);

  // console.log(mode);
  // console.log(request.url);

  console.log(mode, "help");
  const page = request.headers.get("referer");

  darkModeSet(mode);
  // darkModeSetLocal(mode)

  return redirect(page);
}

export default function App() {
  return <Outlet />;
}

export async function loader() {
  const mode = await getDarkMode();

  return mode;
}
