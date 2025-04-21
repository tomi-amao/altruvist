import { motion } from "framer-motion";
import {
  CircleNotch,
  Medal,
  Rocket,
  Calendar,
  Lightning,
  CheckCircle,
  ChartBar,
  HandWaving,
  HandHeart,
} from "@phosphor-icons/react";

export interface BannerItemProps {
  title: string;
  value: string;
  type?: "task" | "metric" | "achievement" | "date" | "circleNotch" | "charity";
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
    <div className="w-full overflow-hidden" data-testid="banner-card">
      <div className="bg-basePrimary rounded-xl shadow-lg overflow-hidden">
        {/* Main content */}
        <div>
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border-b border-baseSecondary/10">
            {showWelcome && date ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-4 md:mb-0 flex items-center"
                data-testid="welcome-section"
              >
                <div className="mr-3">
                  <div className="p-2 bg-baseSecondary/10 rounded-full">
                    <HandWaving
                      weight="duotone"
                      size={28}
                      className="text-baseSecondary"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-header font-semibold text-baseSecondary">
                    Welcome Back
                  </h1>
                  <p
                    className="text-altMidGrey text-sm"
                    data-testid="date-display"
                  >
                    {date}
                  </p>
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* Metrics Section */}
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {bannerItems.map((item, index) => (
                <BannerItem key={index} {...item} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BannerItemWithIndex extends BannerItemProps {
  index: number;
}

function BannerItem({
  title,
  value,
  type = "metric",
  index,
}: BannerItemWithIndex) {
  // Choose icon based on type or title keywords
  const getIcon = () => {
    // First check specific type
    if (type === "task")
      return (
        <Lightning weight="duotone" size={20} className="text-baseSecondary" />
      );
    if (type === "achievement")
      return (
        <Medal weight="duotone" size={20} className="text-baseSecondary" />
      );
    if (type === "date")
      return (
        <Calendar weight="duotone" size={20} className="text-baseSecondary" />
      );
    if (type === "circleNotch")
      return (
        <CircleNotch
          weight="duotone"
          size={20}
          className="text-baseSecondary"
        />
      );
    if (type === "charity")
      return (
        <HandHeart weight="duotone" size={20} className="text-baseSecondary" />
      );

    // Then look for keywords in the title
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("task"))
      return (
        <CheckCircle
          weight="duotone"
          size={20}
          className="text-baseSecondary"
        />
      );
    if (lowerTitle.includes("help"))
      return (
        <Medal weight="duotone" size={20} className="text-baseSecondary" />
      );
    if (lowerTitle.includes("recommend"))
      return (
        <Rocket weight="duotone" size={20} className="text-baseSecondary" />
      );

    // Default for metrics
    return (
      <ChartBar weight="duotone" size={20} className="text-baseSecondary" />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-basePrimaryLight rounded-lg p-4 hover:shadow-md transition-all duration-200
                border-l-2 border-baseSecondary group hover:bg-basePrimary"
      data-testid="banner-item"
    >
      <div className="flex justify-between items-start mb-2">
        <h3
          className="text-baseSecondary/85 font-primary font-medium text-sm w-full"
          data-testid="banner-item-title"
        >
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">{getIcon()}</span>
            <span className="break-words hyphens-auto overflow-visible">
              {title}
            </span>
          </div>
        </h3>
      </div>

      <p
        className="text-lg mt-1 font-semibold break-words text-baseSecondary group-hover:text-baseSecondary/90 transition-colors duration-200"
        title={value}
        data-testid="banner-item-value"
      >
        {value}
      </p>
    </motion.div>
  );
}
