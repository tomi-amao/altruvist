import React, { useState, ReactNode } from "react";
import { TaskSummaryCardMobile } from "../tasks/taskCard";
import { CaretRight, CaretLeft, CalendarBlank } from "@phosphor-icons/react";

// Generic type for table data
export type Column<T> = {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  isSortable?: boolean;
  wrap?: boolean; // Whether to wrap text in this column
};

export type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  handleRowClick?: (item: T) => void;
  itemsPerPage?: number;
  emptyMessage?: string;
  getRowClassName?: (item: T, index: number) => string;
  mobileComponent?: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  showPagination?: boolean;
  showPageSizeOptions?: boolean;
  pageSizeOptions?: number[];
  initialPageSize?: number;
};

// Default mobile component to display table items in a card format on mobile
export const DefaultMobileTableItem = <T extends Record<string, any>>(
  item: T,
  _index: number
) => {
  // Try to determine primary and secondary fields based on column presence
  const title = 
    item.title || 
    item.name || 
    item.header || 
    Object.values(item)[0] || 
    "No title";
    
  const description = 
    item.description || 
    item.content || 
    item.summary || 
    item.text || 
    "";

  const status = item.status || item.state || null;

  return (
    <div className="bg-basePrimaryLight rounded-lg shadow-sm p-4 border border-baseSecondary/10">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-baseSecondary">
          {typeof title === 'string' ? title : 'Item'}
        </h3>
        {status && (
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
            ${
              status === "OPEN" || status === "ACTIVE"
                ? "bg-confirmPrimary/20 text-confirmPrimary"
                : status === "IN_PROGRESS"
                  ? "bg-indicator-blue/20 text-indicator-blue"
                  : status === "COMPLETED" || status === "DONE"
                    ? "bg-indicator-green/20 text-indicator-green"
                    : status === "CANCELLED" || status === "REJECTED"
                      ? "bg-dangerPrimary/20 text-dangerPrimary"
                      : "bg-baseSecondary/10 text-baseSecondary"
            }`}
          >
            {typeof status === 'string' ? status.replace("_", " ") : status}
          </div>
        )}
      </div>
      
      {description && (
        <p className="text-sm text-baseSecondary/80 mb-3 line-clamp-2">
          {description}
        </p>
      )}
      
      {item.deadline && (
        <div className="flex items-center text-xs text-baseSecondary/70 mb-1">
          <CalendarBlank size={14} className="mr-1.5" />
          <span>
            {new Date(item.deadline).toLocaleDateString()}
          </span>
        </div>
      )}
      
      {item.requiredSkills && Array.isArray(item.requiredSkills) && item.requiredSkills.length > 0 && (
        <div className="mt-3 border-t border-baseSecondary/10 pt-2">
          <p className="text-xs font-medium mb-1.5 text-baseSecondary/70">
            Required Skills:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.requiredSkills.slice(0, 2).map((skill: string, i: number) => (
              <span 
                key={i}
                className="bg-basePrimary rounded-md px-2 py-0.5 text-xs text-baseSecondary"
              >
                {skill}
              </span>
            ))}
            {item.requiredSkills.length > 2 && (
              <span className="text-xs text-baseSecondary/70">
                +{item.requiredSkills.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export function DataTable<T>({
  data,
  columns,
  handleRowClick,
  itemsPerPage = 10,
  emptyMessage = "No data available",
  getRowClassName,
  mobileComponent,
  keyExtractor,
  showPagination = true,
  showPageSizeOptions = false,
  pageSizeOptions = [5, 10, 25, 50],
  initialPageSize,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize || itemsPerPage);

  // Calculate total pages
  const totalPages = Math.ceil(data.length / pageSize);

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof T];
        const bValue = b[sortConfig.key as keyof T];

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
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

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    // Reset to first page when changing page size
    setCurrentPage(1);
  };

  // Get unique key for row
  const getKey = (item: T, index: number) => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    return index.toString();
  };

  if (data.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-baseSecondary/70">{emptyMessage}</p>
      </div>
    );
  }

  // Calculate pagination range
  const getPaginationRange = () => {
    // Maximum number of page buttons to show
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      // Show all pages if there aren't many
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Calculate range with current page in the middle when possible
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;

    // Adjust if we're near the end
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="hidden md:block overflow-x-auto rounded-lg border border-baseSecondary/10">
        <table className="min-w-full divide-y divide-baseSecondary/10">
          <thead className="bg-basePrimary/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-baseSecondary/70 uppercase tracking-wider ${
                    column.isSortable ? "cursor-pointer" : ""
                  } ${column.className || ""}`}
                  onClick={() => column.isSortable && requestSort(column.key)}
                  aria-sort={
                    sortConfig?.key === column.key
                      ? sortConfig.direction
                      : "none"
                  }
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-basePrimary/30 divide-y divide-baseSecondary/10">
            {getCurrentPageData().map((item, index) => (
              <tr
                key={getKey(item, index)}
                className={`${
                  getRowClassName
                    ? getRowClassName(item, index)
                    : "hover:bg-basePrimary/50"
                } transition-colors`}
                onClick={() => handleRowClick && handleRowClick(item)}
                style={handleRowClick ? { cursor: "pointer" } : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 ${column.wrap !== false ? "break-words" : "whitespace-nowrap"}`}
                  >
                    {column.render
                      ? column.render(item)
                      : (item[column.key as keyof T] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-basePrimary/20 border-t border-baseSecondary/10">
            <div className="flex items-center gap-4">
              <span className="text-sm text-baseSecondary/70">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, data.length)} of {data.length}{" "}
                entries
              </span>

              {/* Page Size Selector */}
              {showPageSizeOptions && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-baseSecondary/70">Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
                    className="bg-basePrimary/50 border border-baseSecondary/20 rounded-md text-sm text-baseSecondary px-2 py-1 focus:outline-none focus:ring-1 focus:ring-baseSecondary/30"
                    aria-label="Select number of items per page"
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-baseSecondary/70">
                    per page
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-basePrimary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="First page"
              >
                <span className="text-xs text-baseSecondary">First</span>
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-basePrimary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <CaretLeft className="h-5 w-5 text-baseSecondary" />
              </button>

              {getPaginationRange().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded ${
                    currentPage === page
                      ? "bg-basePrimary/70 text-baseSecondary"
                      : "hover:bg-basePrimary/50 text-baseSecondary/70"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-basePrimary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <CaretRight className="h-5 w-5 text-baseSecondary" />
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-basePrimary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Last page"
              >
                <span className="text-xs text-baseSecondary">Last</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile View with Pagination */}
      <div className="md:hidden space-y-4">
        {getCurrentPageData().map((item, index) => (
          <div
            key={getKey(item, index)}
            onClick={() => handleRowClick && handleRowClick(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (handleRowClick) {
                  handleRowClick(item);
                }
              }
            }}
            tabIndex={handleRowClick ? 0 : undefined}
            role={handleRowClick ? "button" : undefined}
          >
            {mobileComponent 
              ? mobileComponent(item, index)
              : DefaultMobileTableItem(item as unknown as Record<string, any>, index)}
          </div>
        ))}

        {/* Mobile Pagination Controls */}
        {showPagination && totalPages > 1 && (
          <div className="space-y-3 px-4 py-3 bg-basePrimary/20 border-t border-baseSecondary/10 rounded-b-lg">
            {/* Page Size Selector for Mobile */}
            {showPageSizeOptions && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-baseSecondary/70">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bg-basePrimary/50 border border-baseSecondary/20 rounded-md text-xs text-baseSecondary px-2 py-1"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-baseSecondary/70">per page</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-basePrimary/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                aria-label="Previous page"
              >
                <CaretLeft className="h-4 w-4 text-baseSecondary" />
                <span className="ml-1 text-xs">Prev</span>
              </button>

              <span className="text-sm text-baseSecondary/70">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-basePrimary/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                aria-label="Next page"
              >
                <span className="mr-1 text-xs">Next</span>
                <CaretRight className="h-4 w-4 text-baseSecondary" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;
