import { CalendarIcon, ClockIcon, PersonIcon } from "@radix-ui/react-icons";

const TaskSummaryCard = () => {
  const task = {
    title: "Develop a Responsive Website",
    charity: "Tech for Good Foundation",
    category: "WEB_DEVELOPMENT",
    urgency: "HIGH",
    // deadline: new Date("2023-12-31"),
    estimatedHours: 40,
    volunteersNeeded: 2,
    requiredSkills: ["React", "Responsive Design"],
    tags: ["Environmental"],
    description:
      "Application develop for a small charity dedicated to revitalising amazonian Forests",
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "HIGH":
        return "text-basePrimary bg-dangerPrimary";
      case "MEDIUM":
        return "text-basePrimary bg-accentPrimary";
      case "LOW":
        return "text-basePrimary bg-basePrimaryLight";
      default:
        return "text-baseSecondary bg-gray-100";
    }
  };

  return (
    <button className="max-w-[19rem] rounded-xl shadow-md overflow-hidden  bg-white hover:shadow-2xl ">
      <div className="px-8 py-6">
        <h2 className="font-semibold py-2 text-base">{task.title}</h2>
        <div className="flex items-center pb-2 gap-2 ">
          <span
            className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${getUrgencyColor(
              task.urgency,
            )}`}
          >
            {task.urgency}
          </span>
          <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold text-basePrimaryDark bg-baseSecondary">
            {task.category.replace(/_/, " ").trim()}
          </span>
        </div>

        <div className="flex flex-row items-center justify-start gap-2 pb-4">
          <div className="flex flex-row items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-baseSecondary" />
            {/* <span>{task.deadline.toLocaleDateString()}</span>s */}
          </div>

          <div className="flex flex-row items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-baseSecondary  " />
            <span>{task.estimatedHours} hours</span>
          </div>
          <div className="flex flex-row items-center">
            <PersonIcon className="h-5 w-5 mr-2 text-baseSecondary" />
            <span>{task.volunteersNeeded}</span>
          </div>
        </div>

        <div className="pb-4 text-left">
          {" "}
          <p>{task.description}</p>
        </div>

        <div className="flex flex-wrap items-center">
          {task.requiredSkills.map((skill, index) => (
            <span
              key={index}
              className="inline-block bg-basePrimaryDark rounded-full px-3 py-1 text-xs font-semibold text-baseSecondary mr-2 mb-2"
            >
              {skill}
            </span>
          ))}
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-block bg-basePrimaryDark rounded-full px-3 py-1 text-xs font-semibold text-baseSecondary mr-2 mb-2"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};

export default TaskSummaryCard;
