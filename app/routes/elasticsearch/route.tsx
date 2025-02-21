import { Client } from "@elastic/elasticsearch";

const elastic = getElasticVars();
const client = new Client({
  node: "http://localhost:9200/",
  auth: {
    username: elastic.ELASTIC_USERNAME,
    password: elastic.ELASTIC_PASSWORD,
  },
});

import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import TaskSummaryCard from "~/components/tasks/taskCard";
import { transformElasticSearchTasks } from "~/components/utils/DataTransformation";
import { getElasticVars } from "~/services/env.server";

export async function loader({ params }: LoaderFunctionArgs) {
  // API Key should have cluster monitor rights.
  const resp = await client.info();
  console.log(params);

  console.log(resp);

  // Let's search!
  const searchResult = await client.search({
    index: "skillanthropy-tasks",
    q: "animal",
  });

  const searchedDocuments = searchResult.hits.hits;
  const rawSearchedTasks = searchedDocuments.map(
    (document) => document._source,
  );
  const searchedTasks = transformElasticSearchTasks(rawSearchedTasks);
  console.log(searchedTasks);

  return { searchedTasks };
}

export default function FullTextSearch() {
  const { searchedTasks } = useLoaderData<typeof loader>();
  return (
    <>
      {/* <div>{searchedDocuments}</div> */}
      {/* <div>{searchedDocuments.map(document => document._source.impact)}</div> */}
      {/* <div>{searchedDocuments.map(document => document)}</div> */}
      {/* <div>{searchedDocuments.map()}</div> */}
      <div>
        {searchedTasks.map((task) => (
          <TaskSummaryCard
            key={task.id}
            title={task.title}
            category={task.category}
            deadline={new Date(task.deadline)}
            description={task.description}
            volunteersNeeded={task?.volunteersNeeded}
            urgency={task.urgency || "LOW"}
            requiredSkills={task.requiredSkills}
            status={task.status}
            id={task.id}
            impact={task.impact}
            charityId={task.charityId || null}
            deliverables={task.deliverables}
            resources={task.resources}
            userId={task.id}
            charityName={task.name || ""}
            userName={task.name || ""}
          />
        ))}
      </div>
    </>
  );
}
