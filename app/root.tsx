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

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Jomhuria&display=swap" rel="stylesheet"></link>
      </head>
      <body className="">
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
