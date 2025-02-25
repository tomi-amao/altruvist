import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "~/../tests/test-utils";
import { ListItem, Section } from "./DashboardSection";

describe("ListItem Component", () => {
  const baseProps = {
    text: "Test Task",
    deadline: new Date(Date.now() + 86400000 * 3), // 3 days from now
    status: "IN_PROGRESS",
    applicationStatus: "PENDING",
    userRole: "USER",
  };

  it("renders task application section correctly", () => {
    render(<ListItem {...baseProps} section="Task Applications" />);

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });

  it("renders in progress tasks with deadline", () => {
    render(<ListItem {...baseProps} section="In Progress Tasks" />);

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("2 days left")).toBeInTheDocument();
  });

  it("shows overdue status for past deadlines", () => {
    render(
      <ListItem
        {...baseProps}
        deadline={new Date(Date.now() - 86400000 * 2)} // 2 days ago
        section="In Progress Tasks"
      />,
    );

    expect(screen.getByText("2 days overdue")).toBeInTheDocument();
  });

  it('shows "Due today" for same-day deadlines', () => {
    render(
      <ListItem
        {...baseProps}
        deadline={new Date(Date.now())}
        section="Not Started Tasks"
      />,
    );

    expect(screen.getByText("Due today")).toBeInTheDocument();
  });

  it("applies correct status color classes", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    render(
      <ListItem
        {...baseProps}
        deadline={tomorrow}
        section="Tasks Nearing Deadline"
      />,
    );

    const deadlineElement = screen.getByText(/days? left|Due today/); // Updated matcher
    expect(deadlineElement).toHaveClass("text-dangerPrimary");
  });

  it("shows correct text for tomorrow deadline", () => {
    // Set up a consistent date/time for testing
    const now = new Date("2024-01-01T12:00:00Z");
    const tomorrow = new Date("2024-01-02T12:00:00Z");

    // Mock the current date
    vi.useFakeTimers();
    vi.setSystemTime(now);

    render(
      <ListItem
        {...baseProps}
        deadline={tomorrow}
        section="Tasks Nearing Deadline"
      />,
    );

    expect(screen.getByText("1 day left")).toBeInTheDocument();

    // Clean up
    vi.useRealTimers();
  });

  it("renders completed tasks without deadline", () => {
    render(
      <ListItem {...baseProps} status="COMPLETED" section="Completed Tasks" />,
    );

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.queryByText(/days/)).not.toBeInTheDocument();
  });
});

describe("Section Component", () => {
  const mockTasks = [
    {
      id: "1",
      title: "Task 1",
      deadline: new Date(Date.now() + 86400000),
      status: "IN_PROGRESS",
      taskApplications: [{ status: "PENDING" }],
    },
    {
      id: "2",
      title: "Task 2",
      deadline: new Date(Date.now() + 86400000 * 2),
      status: "NOT_STARTED",
      taskApplications: [],
    },
  ];

  it("renders section with title and tasks", () => {
    render(<Section title="Test Section" tasks={mockTasks} userRole="USER" />, {
      withRouter: true,
    });

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
  });

  it("displays empty state message when no tasks", () => {
    render(<Section title="Empty Section" tasks={[]} userRole="USER" />);

    expect(screen.getByText("No items to display")).toBeInTheDocument();
  });

  it("renders links with correct task IDs", () => {
    render(<Section title="Test Section" tasks={mockTasks} userRole="USER" />, {
      withRouter: true,
    });

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/dashboard/tasks?taskid=1");
    expect(links[1]).toHaveAttribute("href", "/dashboard/tasks?taskid=2");
  });
});
