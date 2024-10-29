interface BannerSummaryTiles {
  tile1: string;
  tile2: string;
  tile3: string;
  tile4: string | null;
}
export const TaskBannerSummaryCard = ({
  tile1,
  tile2,
  tile3,
  tile4,
}: BannerSummaryTiles) => {
  return (
    <div className="mx-36 rounded-md text-lightGrey text-2xl mt-16 bg-bgsecondary flex flex-row gap-10 justify-evenly p-4">
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Title</h1>
        <h2 className="text-baseSecondary">{tile1}</h2>
      </div>
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Deadline</h1>
        <h2 className="text-base">{tile2}</h2>
      </div>
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Charity</h1>
        <h2 className="text-base">{tile3}</h2>
      </div>
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Type</h1>
        <h2 className="text-base">{tile4}</h2>
      </div>
    </div>
  );
};

export const DashboardBanner2 = ({
  tile1,
  tile2,
  tile3,
  tile4,
}: BannerSummaryTiles) => {
  return (
    <div className="mx-36 rounded-md text-lightGrey text-2xl mt-16 bg-bgsecondary flex flex-row gap-10 justify-evenly p-4">
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Date</h1>
        <h2 className="text-baseSecondary">{tile1}</h2>
      </div>
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Deadline</h1>
        <h2 className="text-base">{tile2}</h2>
      </div>
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Charity</h1>
        <h2 className="text-base">{tile3}</h2>
      </div>
      <div className=" flex flex-col  ">
        <h1 className="text-xs">Type</h1>
        <h2 className="text-base">{tile4}</h2>
      </div>
    </div>
  );
};

export interface BannerItemProps {
  title: string;
  value: string;
}
export interface DashboardBannerProps {
  date?: string;
  bannerItems: BannerItemProps[];
}
const DashboardBanner = ({ date, bannerItems }: DashboardBannerProps) => {
  return (
    <div className=" m-auto w-fit rounded-lg shadow-lg text-baseSecondary border-[1px] border-baseSecondary">
      <div className="container mx-auto flex justify-between items-center gap-4">
        {date && <div className="font-primary pl-2 ">{date}</div>}
        <div className="flex space-x-6">
          {bannerItems.map((item, index) => (
            <BannerItem key={index} title={item.title} value={item.value} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const BannerItem = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => (
  <div className="relative p-2 lg:px-4 flex items-start flex-col">
    <div className="absolute left-0 top-2 bottom-2 w-[1px] bg-baseSecondary "></div>

    <div className="text-sm opacity-80">{title}</div>
    <div className="lg:text-lg font-semibold overflow-hidden ">{value}</div>
  </div>
);

export default DashboardBanner;
