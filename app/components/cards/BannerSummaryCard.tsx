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
