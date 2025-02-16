import React, { useState } from "react";
import { TaskSummaryCardMobile } from "./taskCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TableProps = {
  data: Array<{
    title: string;
    description: string;
    urgency: string;
    requiredSkills: string[];
    deadline: string;
  }>;
  handleRowClick: (item: any) => void;
  itemsPerPage?: number; // New prop for controlling items per page
};

const DataTable = ({
  data,
  handleRowClick,
  itemsPerPage = 10, // Default to 10 items per page
}: TableProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const requestSort = (key: string) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="w-full">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse rounded-lg text-left">
          <thead>
            <tr>
              {[
                "title",
                "description",
                "urgency",
                "requiredSkills",
                "deadline",
              ].map((key) => (
                <th
                  key={key}
                  className="px-4 py-2 cursor-pointer"
                  onClick={() => requestSort(key)}
                  aria-sort={
                    sortConfig?.key === key ? sortConfig.direction : "none"
                  }
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-basePrimaryDark">
            {getCurrentPageData().map((item, index) => (
              <tr key={index} className="border-b-2 border-baseSecondary">
                {Object.entries({
                  title: item.title,
                  description: item.description,
                  urgency: item.urgency,
                  requiredSkills: item.requiredSkills.join(", "),
                  deadline: new Date(item.deadline).toLocaleDateString(),
                }).map(([key, value]) => (
                  <td key={key} className="p-0">
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2  focus:ring focus:ring-baseSecondary focus:outline-none"
                      onClick={() => handleRowClick(item)}
                    >
                      <p className="line-clamp-2">{value}</p>
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm ">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, data.length)} of{" "}
              {data.length} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-basePrimaryDark disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "hover:bg-basePrimaryDark"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-basePrimaryDark disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile View with Pagination */}
      <div className="md:hidden space-y-4">
        {getCurrentPageData().map((task) => (
          <TaskSummaryCardMobile key={task.title} data={task} />
        ))}

        {/* Mobile Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded hover:bg-basePrimaryDark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded hover:bg-basePrimaryDark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
