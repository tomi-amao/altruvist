import { useState } from "react";
import {
  PrimaryButton,
  SecondaryButton,
} from "../../components/utils/BasicButton";
import DashboardBanner, {
  BannerItem,
} from "~/components/cards/BannerSummaryCard";
import Dropdown from "~/components/utils/selectDropdown";
import {
  statusOptions,
  taskCategoryFilterOptions,
  taskCharityCategories,
  charityTags,
  urgencyOptions,
  techSkills,
} from "~/components/utils/OptionsForDropdowns";
import {
  FilePreviewButton,
  FormFieldFloating,
  FormTextarea,
  ListInput,
} from "~/components/utils/FormField";
import CreateTaskForm from "~/components/utils/TaskForm";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import {
  getCharityTasks,
  getUserTasks,
  updateTask,
} from "~/models/tasks.server";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  charities,
  tasks,
  TaskStatus,
  TaskUrgency,
  users,
} from "@prisma/client";
import { getUrgencyColor } from "~/components/cards/taskCard";
import { getCharity } from "~/models/charities.server";
import type { Prisma } from "@prisma/client";
import { NewTaskFormData } from "~/models/types.server";
import { transformUserTaskApplications } from "~/components/utils/DataTransformation";
import { useEffect } from "react";
import { UploadFilesComponent } from "~/components/utils/FileUpload";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken"); //retrieve access token from session to be used as bearer token

  if (!accessToken) {
    return redirect("/zitlogin");
  }
  const { userInfo } = await getUserInfo(accessToken);
  if (!userInfo?.id) {
    return redirect("/zitlogin");
  }
  // const userId = userInfo?.id;
  // const userRole = userInfo.roles
  const { id: userId, roles: userRole, charityId } = userInfo;

  console.log("user id", userId, "charity id", charityId);
  if (userRole.includes("charity")) {
    // console.log("This is user is a charity", charityId);
    const { tasks, error, message, status } = await getCharityTasks(
      charityId || "",
    );
    // console.log(tasks);
    // console.log("Returned tasks", tasks, message, status);

    return { tasks, error, userRole };
  } else if (userRole.includes("techie")) {
    // console.log("This is user is a techie ");
    const { tasks: rawTasks, error } = await getUserTasks(userId);

    const tasks = transformUserTaskApplications(rawTasks);
    return { tasks, error, userRole };
  }
  // console.log(tasks);
}

const bannerItems: BannerItem[] = [
  {
    title: "Recommended Tasks",
    value: "Create a Fundraising Platform for Charity X",
  },
  { title: "Charities Helped", value: "8" },
];

const taskFiles = ["PDF", "PNG", "EXCEL"];
const role: string = "charity";

export default function TaskList() {
  const { tasks, error, userRole } = useLoaderData<typeof loader>();
  const [selectedTask, setSelectedTask] = useState<Partial<tasks> | null>();
  const [selectedCharity, setSelectedCharity] =
    useState<Partial<charities> | null>();
  const [selectedTaskCreator, setSelectedTaskCreator] =
    useState<Partial<users> | null>();
  const [showMessageSection, setShowMessageSection] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState(false);
  const [status, setStatus] = useState<string>();
  const submit = useSubmit();
  const [formData, setFormData] = useState<NewTaskFormData>({
    title: selectedTask?.title || "",
    description: selectedTask?.description || "",
    resources: [],
    requiredSkills: [],
    impact: "",
    urgency: selectedTask?.urgency || "LOW",
    category: selectedTask?.category || [],
    deadline: "",
    volunteersNeeded: null,
    deliverables: [],
  });

  const handleTaskClick = (
    task: Partial<tasks>,
    charity: Partial<charities>,
    taskCreator: Partial<users>,
  ) => {
    setSelectedTask(task);
    setSelectedCharity(charity);
    setSelectedTaskCreator(taskCreator);
    setShowTaskForm(false);
  };
  const onSelect = (option: string) => {
    console.log("Selected action", option);
  };

  const handleShowMessageSection = () => {
    setShowMessageSection((prevalue) => !prevalue);
  };

  const handleShowTaskCreateForm = () => {
    setShowTaskForm((prevalue) => !prevalue);
    setSelectedTask(null);
    setShowMessageSection(false);
    return {};
  };

  const handleUpdateTaskStatus = (
    taskId: string,
    updateTaskData: Prisma.tasksUpdateInput,
    option?: string,
  ) => {
    const jsonUpdateTaskData = JSON.stringify(updateTaskData);

    submit(
      { taskId, updateTaskData: jsonUpdateTaskData, _action: "updateTask" },
      { method: "POST", action: "/dashboard/tasks" },
    );
    setStatus(option);
  };

  const handleUpdateTaskDetails = (
    taskId: string,
    updateTaskData: Prisma.tasksUpdateInput,
  ) => {
    const jsonUpdateTaskData = JSON.stringify(updateTaskData);
    console.log(updateTaskData, taskId);
    setEditTask((preValue) => !preValue);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    // console.log(formData);

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // if selectedTask changes update formData
  useEffect(() => {
    if (selectedTask) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        title: selectedTask.title || "",
        description: selectedTask.description || "",
        urgency: selectedTask.urgency || "LOW",
        deadline: selectedTask.deadline?.toString() || "",
        category: selectedTask.category || [],
        impact: selectedTask.impact || "",
        requiredSkills: selectedTask.requiredSkills || [],
        deliverables: selectedTask.deliverables || [],
        resources: selectedTask.resources || [],
      }));
    }
  }, [selectedTask]); //  run when selectedTask changes

  const formatDateForInput = (date: string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0"); // Ensure two digits
    const day = String(d.getDate()).padStart(2, "0"); // Ensure two digits
    return `${year}-${month}-${day}`;
  };

  const handleRemoveItem = (inputField: string, input: string) => {
    switch (inputField) {
      case "skills":
        setFormData({
          ...formData,
          requiredSkills: formData.requiredSkills.filter(
            (item) => item !== input,
          ),
        });

        break;
      case "categories":
        setFormData({
          ...formData,
          category: formData.category.filter((item) => item !== input),
        });

        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full lg:min-h-screen p-4 -mt-8">
      <div className="lg:w-1/3 w-full p-4 shadow-md space-y-4 rounded-md border border-basePrimaryDark">
        {userRole[0] === "charity" && (
          <PrimaryButton
            ariaLabel="create task button button"
            text="Create Task"
            action={handleShowTaskCreateForm}
          />
        )}

        <input
          type="text"
          placeholder="Search "
          className="w-full flex-grow p-2 bg-basePrimaryDark text-sm lg:text-base rounded"
        />
        <div className="flex mb-4 gap-4">
          <Dropdown
            options={taskCharityCategories}
            placeholder="Filter"
            onSelect={onSelect}
            multipleSelect={true}
          />
          <Dropdown
            options={taskCategoryFilterOptions}
            placeholder="Sort"
            onSelect={onSelect}
            multipleSelect={true}
          />
        </div>

        <ul className=" lg:space-y-0">
          {tasks?.map((task) => (
            <li
              key={task?.id}
              className={` p-4 lg:p-2 border-b-[1px] hover:bg-baseSecondary hover:text-basePrimary rounded cursor-pointer lg:border-dashed ${
                selectedTask?.id?.toString() === task?.id
                  ? "bg-baseSecondary text-basePrimaryDark font-semibold"
                  : ""
              }`}
              onClick={() =>
                handleTaskClick(
                  task as unknown as Partial<tasks>,
                  task?.charity as unknown as Partial<charities>,
                  task?.createdBy as unknown as Partial<users>,
                )
              }
            >
              <div className="text-lg font-primary ">{task?.title}</div>
              <div className="text-sm">{`Due: ${new Date(task?.deadline ? task?.deadline : "").toLocaleDateString()}`}</div>
            </li>
          ))}
        </ul>
      </div>
      {showTaskForm && (
        <div className="w-full mt-4 lg:mt-0 lg:ml-4">
          <CreateTaskForm />
        </div>
      )}
      {selectedTask && (
        <div className="lg:w-2/3 w-full lg:ml-2 mt-4  lg:mt-0 p-6 shadow-md rounded-md border border-basePrimaryDark flex flex-col justify-items-stretch">
          <div className="">
            <DashboardBanner
              bannerItems={[
                ...(editTask
                  ? []
                  : [
                      { title: "Title", value: selectedTask.title! },
                      {
                        title: "Deadline",
                        value: new Date(
                          selectedTask.deadline!,
                        ).toLocaleDateString(),
                      },
                      {
                        title: "Category",
                        value: selectedTask.category![0],
                      },
                    ]),

                ...(selectedCharity?.id
                  ? [{ title: "Charity", value: selectedCharity.name! }]
                  : [{ title: "Creator", value: selectedTaskCreator?.name! }]),
              ]}
            />

            {editTask && (
              <>
                <h1 className="text-base font-primary font-semibold py-4 lg:mt-7">
                  Title
                </h1>
                <FormFieldFloating
                  htmlFor="title"
                  placeholder={"Title the task"}
                  type="string"
                  label="Title"
                  backgroundColour="bg-basePrimary"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                    })
                  }
                  value={formData.title}
                />
              </>
            )}

            <h1 className="text-base font-primary font-semibold py-4 lg:mt-7">
              Description
            </h1>
            {editTask ? (
              <FormTextarea
                autocomplete="off"
                htmlFor="description"
                maxLength={100}
                placeholder={"Describe the task"}
                label="Description"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                value={formData.description}
                backgroundColour="bg-basePrimary"
              />
            ) : (
              <p className=" ">{selectedTask.description}</p>
            )}

            {editTask && (
              <>
                <h1 className="text-base font-primary font-semibold py-4 lg:mt-7">
                  Deadline
                </h1>
                <FormFieldFloating
                  htmlFor="deadline"
                  type="date"
                  label="Deadline"
                  backgroundColour="bg-basePrimary"
                  onChange={handleChange}
                  value={formatDateForInput(formData.deadline)}
                />
                <h1 className="text-base font-primary font-semibold py-4 lg:mt-7">
                  Category
                </h1>
                <div className="flex-col flex w-full">
                  <ListInput
                    inputtedList={formData.category}
                    onInputsChange={(inputs) => {
                      setFormData({
                        ...formData,
                        category: inputs,
                      });
                      console.log(formData.category);
                    }}
                    placeholder="Enter the charitable category of the task"
                    availableOptions={charityTags}
                    allowCustomOptions={false}
                    useDefaultListStyling={false}
                  />
                </div>
                <div className=" max-w-3xl flex-wrap mt-2 ">
                  {formData.category && (
                    <ul className="flex flex-row gap-4 flex-wrap">
                      {formData.category.map((category, index) => (
                        <button
                          className="bg-basePrimaryDark p-2 font-primary rounded-md text-sm hover:bg-dangerPrimary hover:text-basePrimaryLight text-baseSecondary"
                          key={index}
                          onClick={() => {
                            handleRemoveItem("categories", category);
                          }}
                        >
                          {category}
                        </button>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
            <h1 className="text-base font-primary font-semibold py-4 lg:mt-2">
              Impact
            </h1>
            {editTask ? (
              <>
                <FormFieldFloating
                  htmlFor="impact"
                  placeholder={"Task impact"}
                  type="string"
                  label="Impact"
                  backgroundColour="bg-basePrimary"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      impact: e.target.value,
                    })
                  }
                  value={formData.impact}
                />
              </>
            ) : (
              <>
                <p className=" font-primary  ">{selectedTask.impact}</p>
              </>
            )}
            <h1 className="text-base font-primary font-semibold mt-2 py-2 ">
              Key Deliverables
            </h1>
            {editTask ? (
              <>
                {" "}
                <div className="flex-col flex w-full">
                  <ListInput
                    inputtedList={formData.deliverables}
                    onInputsChange={(inputs) => {
                      setFormData({
                        ...formData,
                        deliverables: inputs,
                      });
                      console.log(formData.deliverables);
                    }}
                    placeholder="Add a key deliverable that will reach the outcome of the task"
                    allowCustomOptions={true}
                    useDefaultListStyling={true}
                  />
                </div>
              </>
            ) : (
              <>
                {" "}
                <p className=" font-primary px-3 ">
                  {selectedTask?.deliverables?.map((item) => <li> {item}</li>)}
                </p>
              </>
            )}

            <h1 className="text-base font-primary font-semibold mt-2 py-2 ">
              Urgency
            </h1>
            {editTask ? (
              <>
                {" "}
                <Dropdown
                  multipleSelect={false}
                  placeholder={selectedTask.urgency as string}
                  options={urgencyOptions}
                  onSelect={(option) => {
                    setFormData({
                      ...formData,
                      urgency: option as TaskUrgency,
                    });
                  }}
                />{" "}
              </>
            ) : (
              <>
                {" "}
                <span
                  className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${getUrgencyColor(
                    selectedTask.urgency || "LOW",
                  )}`}
                >
                  {" "}
                  {selectedTask.urgency || "LOW"}
                </span>
              </>
            )}
            <h1 className="text-base font-primary font-semibold py-2 mt-2 ">
              Required Skills
            </h1>
            {editTask ? (
              <>
                <div className="flex-col flex w-full">
                  <ListInput
                    inputtedList={formData.requiredSkills}
                    onInputsChange={(inputs) => {
                      setFormData({
                        ...formData,
                        requiredSkills: inputs,
                      });
                      console.log(formData.requiredSkills);
                    }}
                    placeholder="Add a skill relevant to completing the project"
                    availableOptions={techSkills}
                    allowCustomOptions={false}
                    useDefaultListStyling={false}
                  />
                </div>
                <div className=" max-w-3xl flex-wrap mt-2 ">
                  {formData.requiredSkills && (
                    <ul className="flex flex-row gap-4 flex-wrap">
                      {formData.requiredSkills.map((skill, index) => (
                        <button
                          className="bg-basePrimaryDark p-2 font-primary rounded-md text-sm hover:bg-dangerPrimary hover:text-basePrimaryLight text-baseSecondary"
                          key={index}
                          onClick={() => {
                            handleRemoveItem("skills", skill);
                          }}
                        >
                          {skill}
                        </button>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <>
                {" "}
                {selectedTask?.requiredSkills?.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-block bg-basePrimaryDark rounded-full px-3 py-1 text-xs font-semibold text-baseSecondary mr-2 mb-2"
                  >
                    {skill}
                  </span>
                ))}
              </>
            )}

            {selectedTask.resources && (
              <div className="">
                <h1 className="font-primary text-base pt-4 font-semibold">
                  Attachments
                </h1>
                <div className="flex gap-4 mt-2">
                  {!editTask && (
                    <>
                      {" "}
                      {selectedTask.resources.map((resource) => (
                        <FilePreviewButton
                          fileName={resource.name}
                          fileSize={resource.size}
                          fileUrl={resource.uploadURL}
                          fileExtension={resource.extension}
                        />
                      ))}
                    </>
                  )}
                </div>
                {editTask && (
                  <UploadFilesComponent
                    formData={formData}
                    setFormData={setFormData}
                  />
                )}
              </div>
            )}

            <div className="">
              <h1 className="font-primary text-base pt-4 font-semibold">
                Status
              </h1>
              <div className="flex gap-4 mt-2">
                <Dropdown
                  multipleSelect={false}
                  placeholder={selectedTask.status as string}
                  options={statusOptions}
                  onSelect={(option) => {
                    handleUpdateTaskStatus(selectedTask.id!, {
                      status: option as TaskStatus,
                    });
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex h-full items-end mb-6">
            <div className="py-3 mt-6 space-x-4 flex">
              {userRole.includes("charity") && (
                <SecondaryButton
                  ariaLabel="edit current task"
                  text={editTask ? "Save Task" : "Edit Task"}
                  action={
                    editTask
                      ? () =>
                          handleUpdateTaskDetails(selectedTask.id!, formData)
                      : () => {
                          setEditTask((preValue) => !preValue);
                        }
                  }
                />
              )}

              <SecondaryButton
                ariaLabel="message volunteer"
                text={
                  role === "charity" ? "Message Volunteer" : "Message Charity"
                }
                action={handleShowMessageSection}
              />
              <button className="px-4 py-2 bg-dangerPrimary text-basePrimaryDark rounded">
                {userRole.includes("charity")
                  ? "Cancel task"
                  : "Withdraw from task"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="hidden relative lg:flex items-center px-1">
        <div className="h-screen w-[1px] bg-baseSecondary"></div>{" "}
      </div>
      {showMessageSection && <MessageSection />}
    </div>
  );
}

export const MessageSection = () => {
  return (
    <div className="mt-4 lg:mt-0 h-80 lg:h-screen rounded shadow-lg w-full lg:w-8/12 pl-2 flex flex-col justify-between">
      <div>hello</div>
      <div className="mb-2 lg:mb-14 pr-2">
        <FormFieldFloating
          htmlFor="message"
          placeholder={
            role === "chartiy" ? "Message Volunteer" : "Message Charity"
          }
        />
      </div>
    </div>
  );
};

export const EditTitle = (
  formData: any,
  handleChange: any,
  defaultValue: any,
) => {
  return (
    <FormFieldFloating
      htmlFor="title"
      placeholder={defaultValue}
      type="string"
      label=""
      backgroundColour="bg-basePrimary"
      onChange={handleChange}
      value={formData.title}
      defaultValue={defaultValue}
    />
  );
};

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.formData();
  const updateTaskData = data.get("updateTaskData")?.toString();
  const taskId = data.get("taskId")?.toString();
  console.log(taskId, updateTaskData);
  const updatedTaskData = await updateTask(taskId, JSON.parse(updateTaskData));
  console.log(updatedTaskData);

  return {};
}
