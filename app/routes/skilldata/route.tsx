import { LoaderFunctionArgs } from "@remix-run/node";

export default function Data() {
  return (
    <>
      <div>
        <h1 className="text-txtprimary"> Hello Data</h1>
      </div>
    </>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("Hello data");
  console.log(request.url);

  return {};
}
