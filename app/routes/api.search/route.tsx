import { LoaderFunctionArgs, } from "react-router";
import { searchMultipleIndices } from "~/services/meilisearch.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("search") || "";

  try {
    const { rawSearchedDocuments } = await searchMultipleIndices(query);
    return { status: 200, rawSearchedDocuments };
  } catch (error) {
    console.error("Meilisearch error:", error);
    return {
      status: 400,
      message: "An error occurred while searching. Please try again later.",
      rawSearchedDocuments: [],
    }
  }
}
