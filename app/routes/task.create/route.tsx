import { ActionFunctionArgs } from "@remix-run/node";
import CreateTaskForm from "~/components/utils/TaskForm";

export default function TaskCreate() {
  return <CreateTaskForm />;
}

export async function loader() {
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.formData();
  const {
    title,
    description,
    impact,
    volunteers,
    deliverables,
    deadline,
    urgency,
    requiredSkills,
    categories,
  } = Object.fromEntries(data);

  console.log(
    title,
    description,
    deadline,
    impact,
    volunteers,
    deliverables,
    urgency,
    requiredSkills,
    categories,
  );

  if (typeof requiredSkills === "string") {
    const taskSkills = requiredSkills.split(",");
    return { taskSkills };
  }
  if (typeof categories === "string") {
    const taskCategories = categories.split(",");
    return { taskCategories };
  }
  return {};
}
