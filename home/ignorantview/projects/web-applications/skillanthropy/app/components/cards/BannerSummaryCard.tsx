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
    <div className="w-full rounded-md bg-bgsecondary p-4">
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex flex-col min-w-[150px]">
          <h1 className="text-xs text-lightGrey">Title</h1>
          <h2 className="text-baseSecondary">{tile1}</h2>
        </div>
        <div className="flex flex-col min-w-[150px]">
          <h1 className="text-xs text-lightGrey">Deadline</h1>
          <h2 className="text-base">{tile2}</h2>
        </div>
        <div className="flex flex-col min-w-[150px]">
          <h1 className="text-xs text-lightGrey">Charity</h1>
          <h2 className="text-base">{tile3}</h2>
        </div>
        <div className="flex flex-col min-w-[150px]">
          <h1 className="text-xs text-lightGrey">Type</h1>
          <h2 className="text-base">{tile4}</h2>
        </div>
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
    <div className="w-full rounded-md bg-bgsecondary p-4">
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex flex-col min-w-[150px]">
          <h1 className="text-xs text-lightGrey">Date</h1>
          <h2 className="text-baseSecondary">{tile1}</h2>
        </div>
        <div className="flex flex-col min-w-[150px]">
          <h1 className="text-xs text-lightGrey">Deadline</h1>
          <h2 className="text-base">{tile2}</h2>
        </div>
        <div className="flex flex-col min-w-[150px]">
          <h1 className="text-xs text-lightGrey">Charity</h1>
          <h2 className="text-base">{tile3}</h2>
        </div>
        <div className="flex flex-col min-w-[150px]">
          <h1 className="text-xs text-lightGrey">Type</h1>
          <h2 className="text-base">{tile4}</h2>
        </div>
      </div>
    </div>
  );
};

export interface BannerItemProps {
  title: string;
  value: string;
}

interface DashboardBannerProps {
  date?: string;
  bannerItems: BannerItemProps[];
  showWelcome?: boolean;
}

export default function DashboardBanner({
  date,
  bannerItems,
  showWelcome = true,
}: DashboardBannerProps) {
  return (
    <div className="w-full bg-basePrimary rounded-lg shadow-lg p-6  ">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {showWelcome && date ? (
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-semibold font-primary text-baseSecondary">
              Welcome Back
            </h1>
            <p className="text-altMidGrey mt-1">{date}</p>
          </div>
        ) : null}
        <div className="flex flex-col md:flex-row gap-4 w-full flex-wrap">
          {bannerItems.map((item, index) => (
            <BannerItem key={index} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BannerItem({ title, value }: BannerItemProps) {
  return (
    <div className="bg-basePrimaryLight p-4 rounded-lg md:flex-1 w-full md:w-auto border-l-2 border-baseSecondary">
      <h3 className="text-baseSecondary/85 font-primary font-medium text-sm">
        {title}
      </h3>
      <p
        className="text-lg mt-1 font-semibold  truncate text-baseSecondary"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
