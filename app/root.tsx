import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  redirect,
  useNavigate,
  useRouteError,
} from "@remix-run/react";
import type {
  ActionFunctionArgs,
  LinksFunction,
} from "@remix-run/node";
import stylesheet from "~/styles/tailwind.css?url";



import { ErrorCard } from "./components/utils/ErrorCard";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesheet }];
};

export function Layout({ children }: { children: React.ReactNode }) {

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

  const page = request.headers.get("referer");



  return redirect(page);
}



export function ErrorBoundary() {
  const error = useRouteError();

  // Handle 404 errors
  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 400:
        return (
          <html lang="en">
            <head>
              <Meta />
              <Links />
              <title>Bad Request</title>
            </head>
            <body>
              <ErrorCard 
                title="400 - Bad Request"
                message="The request could not be understood by the server."
                subMessage="Please check your input and try again."
              />
              <Scripts />
            </body>
          </html>
        );

      case 401:
        return (
          <html lang="en">
            <head>
              <Meta />
              <Links />
              <title>Unauthorized</title>
            </head>
            <body>
              <ErrorCard 
                title="401 - Unauthorized"
                message="You need to be authenticated to access this page."
                subMessage="Please log in and try again."
              />
              <Scripts />
            </body>
          </html>
        );

      case 403:
        return (
          <html lang="en">
            <head>
              <Meta />
              <Links />
              <title>Forbidden</title>
            </head>
            <body>
              <ErrorCard 
                title="403 - Forbidden"
                message="You don't have permission to access this resource."
                subMessage="Please contact your administrator if you think this is a mistake."
              />
              <Scripts />
            </body>
          </html>
        );

      case 404:
        return (
          <html lang="en">
            <head>
              <Meta />
              <Links />
              <title>Not Found</title>
            </head>
            <body>
              <ErrorCard 
                title="404 - Not Found"
                message="The page you're looking for doesn't exist or was moved."
                subMessage="Please check the URL and try again."
              />
              <Scripts />
            </body>
          </html>
        );

      case 408:
        return (
          <html lang="en">
            <head>
              <Meta />
              <Links />
              <title>Request Timeout</title>
            </head>
            <body>
              <ErrorCard 
                title="408 - Timeout"
                message="The request took too long to complete."
                subMessage="Please try again. If the problem persists, contact support."
              />
              <Scripts />
            </body>
          </html>
        );

      case 500:
        return (
          <html lang="en">
            <head>
              <Meta />
              <Links />
              <title>Server Error</title>
            </head>
            <body>
              <ErrorCard 
                title="500 - Server Error"
                message="An internal server error occurred."
                subMessage="Our team has been notified. Please try again later."
              />
              <Scripts />
            </body>
          </html>
        );

      case 503:
        return (
          <html lang="en">
            <head>
              <Meta />
              <Links />
              <title>Service Unavailable</title>
            </head>
            <body>
              <ErrorCard 
                title="503 - Unavailable"
                message="The service is temporarily unavailable."
                subMessage="Please try again later. We're working to restore service."
              />
              <Scripts />
            </body>
          </html>
        );

      default:
        return (
          <html lang="en">
            <head>
              <Meta />
              <Links />
              <title>Error {error.status}</title>
            </head>
            <body>
              <ErrorCard 
                title={`${error.status} - Error`}
                message={error.data?.message || "An unexpected error occurred."}
                subMessage="Please try again later."
              />
              <Scripts />
            </body>
          </html>
        );
    }
  }

  // Handle non-HTTP errors (runtime errors, etc.)
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        <title>Error</title>
      </head>
      <body>
        <ErrorCard 
          title="Oops!"
          message={error instanceof Error ? error.message : "An unexpected error occurred."}
          subMessage="If this persists, please contact support."
        />
        <Scripts />
      </body>
    </html>
  );
}




export default function App() {
  return <Outlet />;
}
