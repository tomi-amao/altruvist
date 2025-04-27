import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  redirect,
  useRouteError,
  useLoaderData,
} from "@remix-run/react";
import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import stylesheet from "~/styles/tailwind.css?url";

import { ErrorCard } from "./components/utils/ErrorCard";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
    ENV: {
      GOOGLE_RECAPTCHA_SITE_KEY: string;
          };
  }
}

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesheet }];
};

export const loader: LoaderFunction = () => {
  return ({
    ENV: {
      GOOGLE_RECAPTCHA_SITE_KEY: process.env.GOOGLE_RECAPTCHA_SITE_KEY,
    },
  });
};

export const meta: MetaFunction = () => {
  return [
    { title: "Altruvist" },
    { name: "description", content: "Connect volunteers with charitable tasks" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" }
  ];
};

// Document component to consistently handle document structure
export function Document({
  children,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body className="">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Use Document in both App and ErrorBoundary for consistent document structure
export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <Document>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
        }}
      />
      <Outlet />
    </Document>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const page = request.headers.get("referer") || "/";
  return redirect(page);
}

export function ErrorBoundary() {
  const error = useRouteError();

  // Handle 404 errors
  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 400:
        return (
          <Document title="Bad Request">
            <ErrorCard
              title="400 - Bad Request"
              message="The request could not be understood by the server."
              subMessage="Please check your input and try again."
            />
          </Document>
        );

      case 401:
        return (
          <Document title="Unauthorized">
            <ErrorCard
              title="401 - Unauthorized"
              message="You need to be authenticated to access this page."
              subMessage="Please log in and try again."
            />
          </Document>
        );

      case 403:
        return (
          <Document title="Forbidden">
            <ErrorCard
              title="403 - Forbidden"
              message="You don't have permission to access this resource."
              subMessage="Please contact your administrator if you think this is a mistake."
            />
          </Document>
        );

      case 404:
        return (
          <Document title="Not Found">
            <ErrorCard
              title="404 - Not Found"
              message="The page you're looking for doesn't exist or was moved."
              subMessage="Please check the URL and try again."
            />
          </Document>
        );

      case 408:
        return (
          <Document title="Request Timeout">
            <ErrorCard
              title="408 - Timeout"
              message="The request took too long to complete."
              subMessage="Please try again. If the problem persists, contact support."
            />
          </Document>
        );

      case 500:
        return (
          <Document title="Server Error">
            <ErrorCard
              title="500 - Server Error"
              message="An internal server error occurred."
              subMessage="Our team has been notified. Please try again later."
            />
          </Document>
        );

      case 503:
        return (
          <Document title="Service Unavailable">
            <ErrorCard
              title="503 - Unavailable"
              message="The service is temporarily unavailable."
              subMessage="Please try again later. We're working to restore service."
            />
          </Document>
        );

      default:
        return (
          <Document title={`Error ${error.status}`}>
            <ErrorCard
              title={`${error.status} - Error`}
              message={error.data?.message || "An unexpected error occurred."}
              subMessage="Please try again later."
            />
          </Document>
        );
    }
  }

  // Handle non-HTTP errors (runtime errors, etc.)
  return (
    <Document title="Error">
      <ErrorCard
        title="Oops!"
        message={
          error instanceof Error
            ? error.message
            : "An unexpected error occurred."
        }
        subMessage="If this persists, please contact support."
      />
    </Document>
  );
}
