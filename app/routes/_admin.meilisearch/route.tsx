import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { useEffect, useState } from "react";

// Remove direct imports from meilisearch.server.ts
import type { LoaderReturn, ActionReturn } from "./types";

export { loader } from "./loader.server";
export { action } from "./action.server";

export default function SearchTestPage() {
  const navigation = useNavigation();
  const loaderData = useLoaderData<LoaderReturn>();
  const actionData = useActionData<ActionReturn>();
  const [testResult, setTestResult] = useState<unknown>(null);

  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.result) {
      setTestResult(actionData.result);
    } else if (actionData?.details) {
      setTestResult(actionData.details);
    }
  }, [actionData]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Meilisearch Test Dashboard</h1>

      <div className="bg-basePrimary p-4 rounded-md mb-6 border border-baseSecondary">
        <h2 className="text-2xl font-semibold mb-2">Connection Status</h2>
        <div className="flex items-center">
          <div
            className={`w-4 h-4 rounded-full mr-2 ${loaderData.isConnected ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span>
            {loaderData.isConnected
              ? "Connected to Meilisearch"
              : "Disconnected"}
          </span>
        </div>
      </div>

      {loaderData.indicesStats && (
        <div className="bg-basePrimary p-4 rounded-md mb-6 border border-baseSecondary">
          <h2 className="text-2xl font-semibold mb-2">Indices Statistics</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Index</th>
                  <th className="text-left py-2">Documents</th>
                  <th className="text-left py-2">Is Indexing</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(loaderData.indicesStats).map(
                  ([indexName, stats]: [string, Record<string, unknown>]) => (
                    <tr key={indexName} className="border-b">
                      <td className="py-2">{indexName}</td>
                      <td className="py-2">{stats.numberOfDocuments}</td>
                      <td className="py-2">
                        {stats.isIndexing ? "Yes" : "No"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-basePrimary p-4 rounded-md border border-baseSecondary">
          <h2 className="text-xl font-semibold mb-4">Initialize Indices</h2>
          <Form method="post">
            <input type="hidden" name="action" value="initialize" />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-baseSecondary text-basePrimary py-2 px-4 rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              {isSubmitting && actionData?.action === "initialize"
                ? "Initializing..."
                : "Initialize Meilisearch Indices"}
            </button>
          </Form>
        </div>
      </div>

      {actionData && (
        <div
          className={`mb-6 p-4 rounded-md ${actionData.success ? "bg-green-100 border border-green-300" : "bg-red-100 border border-red-300"}`}
        >
          <h3 className="font-semibold">
            {actionData.action} - {actionData.success ? "Success" : "Error"}
          </h3>
          <p>{actionData.message}</p>
          {actionData.error && (
            <p className="text-red-500 mt-2">Error: {actionData.error}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-basePrimary p-4 rounded-md border border-baseSecondary">
          <h2 className="text-xl font-semibold mb-4">Sync All Data</h2>
          <Form method="post">
            <input type="hidden" name="action" value="sync-all" />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-baseSecondary text-basePrimary py-2 px-4 rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              {isSubmitting && actionData?.action === "sync-all"
                ? "Syncing..."
                : "Sync All Data From MongoDB"}
            </button>
          </Form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-basePrimary p-4 rounded-md border border-baseSecondary">
          <h2 className="text-xl font-semibold mb-4">Index Single Document</h2>

          <Form method="post" className="mb-4">
            <input type="hidden" name="action" value="index-task" />
            <div className="mb-4">
              <label htmlFor="taskId" className="block mb-2">
                Select Task:
              </label>
              <select
                id="taskId"
                name="taskId"
                className="border rounded py-1 px-2 w-full bg-basePrimaryDark"
                required
              >
                <option value="">Select a task</option>
                {loaderData.sampleTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-baseSecondary text-basePrimary py-1 px-4 rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              Index Task
            </button>
          </Form>

          <Form method="post" className="mb-4">
            <input type="hidden" name="action" value="index-user" />
            <div className="mb-4">
              <label htmlFor="userId" className="block mb-2">
                Select User:
              </label>
              <select
                id="userId"
                name="userId"
                className="border rounded py-1 px-2 w-full bg-basePrimaryDark"
                required
              >
                <option value="">Select a user</option>
                {loaderData.sampleUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-baseSecondary text-basePrimary py-1 px-4 rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              Index User
            </button>
          </Form>

          <Form method="post">
            <input type="hidden" name="action" value="index-charity" />
            <div className="mb-4">
              <label htmlFor="charityId" className="block mb-2">
                Select Charity:
              </label>
              <select
                id="charityId"
                name="charityId"
                className="border rounded py-1 px-2 w-full bg-basePrimaryDark"
                required
              >
                <option value="">Select a charity</option>
                {loaderData.sampleCharities.map((charity) => (
                  <option key={charity.id} value={charity.id}>
                    {charity.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-baseSecondary text-basePrimary py-1 px-4 rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              Index Charity
            </button>
          </Form>
        </div>

        <div className="bg-basePrimary p-4 rounded-md border border-baseSecondary">
          <h2 className="text-xl font-semibold mb-4">Delete Documents</h2>

          {/* Existing delete single document form */}
          <Form method="post" className="mb-6">
            <input type="hidden" name="action" value="delete-document" />
            <div className="mb-4">
              <label htmlFor="deleteIndexName" className="block mb-2">
                Index:
              </label>
              <select
                id="deleteIndexName"
                name="indexName"
                className="border rounded py-1 px-2 w-full bg-basePrimaryDark"
                required
              >
                <option value="">Select an index</option>
                <option value={loaderData.indices.TASKS}>
                  {loaderData.indices.TASKS}
                </option>
                <option value={loaderData.indices.USERS}>
                  {loaderData.indices.USERS}
                </option>
                <option value={loaderData.indices.CHARITIES}>
                  {loaderData.indices.CHARITIES}
                </option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="deleteDocId" className="block mb-2">
                Document ID:
              </label>
              <input
                id="deleteDocId"
                type="text"
                name="docId"
                className="border rounded py-1 px-2 w-full bg-basePrimaryDark"
                placeholder="Document ID to delete"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-dangerPrimary text-basePrimary py-2 px-4 rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              Delete Document
            </button>
          </Form>

          {/* New form for deleting all documents */}
          <Form method="post">
            <input type="hidden" name="action" value="delete-all-documents" />
            <div className="mb-4">
              <label htmlFor="deleteAllIndexName" className="block mb-2">
                Index:
              </label>
              <select
                id="deleteAllIndexName"
                name="indexName"
                className="border rounded py-1 px-2 w-full bg-basePrimaryDark"
                required
              >
                <option value="">Select an index</option>
                <option value={loaderData.indices.TASKS}>
                  {loaderData.indices.TASKS}
                </option>
                <option value={loaderData.indices.USERS}>
                  {loaderData.indices.USERS}
                </option>
                <option value={loaderData.indices.CHARITIES}>
                  {loaderData.indices.CHARITIES}
                </option>
                <option value={loaderData.indices.TASK_APPLICATIONS}>
                  {loaderData.indices.TASK_APPLICATIONS}
                </option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-dangerPrimary text-basePrimary py-2 px-4 rounded hover:bg-opacity-90 disabled:opacity-50"
              onClick={(e) => {
                if (
                  !confirm(
                    "Are you sure you want to delete ALL documents from this index? This action cannot be undone.",
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              Delete All Documents
            </button>
          </Form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-basePrimary p-4 rounded-md border border-baseSecondary">
          <h2 className="text-xl font-semibold mb-4">Search Tasks by IDs</h2>
          <Form method="post">
            <input type="hidden" name="action" value="search-tasks" />
            <div className="mb-4">
              <label htmlFor="searchTasksQuery" className="block mb-2">
                Query:
              </label>
              <input
                id="searchTasksQuery"
                type="text"
                name="query"
                className="border rounded py-1 px-2 w-full bg-basePrimaryDark"
                placeholder="Enter search query"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="searchTaskIds" className="block mb-2">
                Task IDs (comma separated):
              </label>
              <input
                id="searchTaskIds"
                type="text"
                name="taskIds"
                className="border rounded py-1 px-2 w-full bg-basePrimaryDark"
                placeholder="id1,id2,id3"
                defaultValue={loaderData.sampleTasks
                  .map((task) => task.id)
                  .join(",")}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-baseSecondary text-basePrimary py-2 px-4 rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              Search Tasks
            </button>
          </Form>
        </div>

        <div className="bg-basePrimary p-4 rounded-md border border-baseSecondary">
          <h2 className="text-xl font-semibold mb-4">Search All Indices</h2>
          <Form method="post">
            <input type="hidden" name="action" value="search-all" />
            <div className="mb-4">
              <label htmlFor="searchAllQuery" className="block mb-2">
                Query:
              </label>
              <input
                id="searchAllQuery"
                type="text"
                name="query"
                className="border rounded py-1 px-2 w-full bg-basePrimaryDark"
                placeholder="Enter search query"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-baseSecondary text-basePrimary py-2 px-4 rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              Search All
            </button>
          </Form>
        </div>
      </div>

      {testResult && (
        <div className="bg-basePrimaryDark p-4 rounded-md border border-baseSecondary mt-6">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          <pre className="whitespace-pre-wrap overflow-x-auto bg-basePrimaryLight p-4 rounded">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
