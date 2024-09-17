import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import CreateTaskForm from "~/components/utils/TaskForm";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";

export default function TaskCreate() {
  const actionData = useActionData<typeof action>()
  console.log(actionData);
  
  return <CreateTaskForm />;
}

export async function loader() {
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.formData();
  const session = await getSession(request);
  const accessToken = session.get("accessToken"); //retrieve access token from session to be used as bearer token

  if (!accessToken) {
    return redirect("/login");
  }
  const { userInfo, error } = await getUserInfo(accessToken);

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
    uploadedResources
  } = Object.fromEntries(data);

  console.log(
    userInfo?.id,
    title,
    description,
    deadline,
    impact,
    volunteers,
    deliverables,
    urgency,
    requiredSkills,
    categories,
    uploadedResources
  );

  // const uploadedItems = JSON.parse(uppyResult as string)
  // const successItems = uploadedItems.filter((item) => {if (!item.successful.length) {return item}})
  // console.log(uploadedItems);
  


  if (typeof requiredSkills === "string") {
    const taskSkills = requiredSkills.split(",");
    return { taskSkills, };
  }
  if (typeof categories === "string") {
    const taskCategories = categories.split(",");
    return { taskCategories, };
  }
  return {};
}
