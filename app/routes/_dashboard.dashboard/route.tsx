import DashboardBanner, {
  BannerItem,
} from "~/components/cards/BannerSummaryCard";

export default function DashboardHome() {
  const bannerItems: BannerItem[] = [
    {
      title: "Recommended Tasks",
      value: "Create a Fundraising Platform for Charity X",
    },
    { title: "Charities Helped", value: "8" },
  ];

  const sectionsData = [
    {
      title: "Tasks",
      listItems: ["Nearing deadline", "Saved", "Completed"],
    },
    {
      title: "Impact",
      listItems: ["Charities helped"],
      extraHeading: "Skill utilisation",
      extraListItems: ["Most used skills"],
    },
    {
      title: "Recognition",
      listItems: ["Positive feedback", "Top volunteer"],
    },
    {
      title: "Recognition",
      listItems: ["Positive feedback", "Top volunteer"],
    },
  ];
  return (
    <>
      <div>
        <div className=" p-4 m-auto ">
          <div className="m-auto  ">
            <DashboardBanner
              date={new Date().toDateString()}
              bannerItems={bannerItems}
            />
          </div>
        </div>
      </div>
      <div className="container mx-auto p-4 ">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sectionsData.map((section, index) => (
            <Section
              key={index}
              title={section.title}
              listItems={section.listItems}
              extraHeading={section.extraHeading}
              extraListItems={section.extraListItems}
            />
          ))}
        </div>
      </div>{" "}
    </>
  );
}

type SectionProps = {
  title: string;
  listItems: string[];
  extraHeading?: string;
  extraListItems?: string[];
};

type ListItemProps = {
  text: string;
};

export const ListItem: React.FC<ListItemProps> = ({ text }) => (
  <li className="py-2 border-b  last:border-b-0">{text}</li>
);

export const Section: React.FC<SectionProps> = ({
  title,
  listItems,
  extraHeading,
  extraListItems,
}) => (
  <div className=" rounded-lg shadow-md mb-4 p-4 border-[1px] border-basePrimaryDark">
    <h2 className="text-xl font-semibold font-primary mb-3">{title}</h2>
    <ul>
      {listItems.map((item, index) => (
        <ListItem key={index} text={item} />
      ))}
    </ul>

    {extraHeading && (
      <>
        <h3 className="text-lg font-semibold mt-4 mb-2 font-primary">
          {extraHeading}
        </h3>
        <ul>
          {extraListItems?.map((item, index) => (
            <ListItem key={index} text={item} />
          ))}
        </ul>
      </>
    )}
  </div>
);
