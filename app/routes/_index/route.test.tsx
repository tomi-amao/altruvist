import { loader } from "./route";
import { prisma } from "~/services/db.server";
import { getSession, commitSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { LoaderFunctionArgs } from "react-router";

// Mock all external dependencies to isolate the loader function for testing
// This prevents actual database calls or session management during tests
vi.mock("~/services/db.server", () => ({
  prisma: {
    tasks: {
      findMany: vi.fn(), // Mock the database query for tasks
    },
  },
}));

vi.mock("~/services/session.server", () => ({
  getSession: vi.fn(), // Mock session retrieval
  commitSession: vi.fn(), // Mock session saving
}));

vi.mock("~/models/user2.server", () => ({
  getUserInfo: vi.fn(), // Mock user information retrieval
}));

describe("Index route loader", () => {
  // Reset all mocks before each test to ensure clean state
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Sample task data used across multiple tests
  const mockTasks = [
    {
      id: 1,
      title: "Task 1",
      createdAt: new Date("2024-01-01"),
      urgency: "HIGH",
      charity: { name: "Charity 1" },
      taskApplications: [],
      _count: { taskApplications: 2 }, // This task has 2 applications
    },
    {
      id: 2,
      title: "Task 2",
      createdAt: new Date("2024-01-15"),
      urgency: "MEDIUM",
      charity: { name: "Charity 2" },
      taskApplications: [],
      _count: { taskApplications: 1 },
    },
  ];

  // Test 1: Verify behavior when no user is logged in
  it("handles unauthenticated user request", async () => {
    // Setup: Create a session with no access token
    const mockSession = { get: vi.fn().mockReturnValue(null) };
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.tasks.findMany as jest.Mock).mockResolvedValue(mockTasks);

    // Execute: Call the loader with a mock request
    const response = await loader({
      request: new Request("http://test.com"),
    } as LoaderFunctionArgs);
    const data = await response.json();

    // Assert: Verify expected behavior for anonymous users
    expect(data.message).toBe("User not logged in");
    expect(data.userInfo).toBeNull();
    expect(data.recentTasks).toHaveLength(2);
  });

  // Test 2: Verify behavior when a user is logged in
  it("handles authenticated user request", async () => {
    // Setup: Create a session with an access token
    const mockSession = {
      get: vi
        .fn()
        .mockImplementation((key) =>
          key === "accessToken" ? "fake-token" : null,
        ),
    };
    const mockUserInfo = { id: 123, name: "Test User" };

    // Mock the responses for authenticated user scenario
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (getUserInfo as jest.Mock).mockResolvedValue({ userInfo: mockUserInfo });
    (prisma.tasks.findMany as jest.Mock).mockResolvedValue(mockTasks);

    // Execute: Call the loader
    const response = await loader({
      request: new Request("http://test.com"),
    } as LoaderFunctionArgs);
    const data = await response.json();

    // Assert: Verify authenticated user response
    expect(data.message).toBe("User logged in");
    expect(data.userInfo).toEqual(mockUserInfo);
  });

  // Test 3: Verify flash message handling
  it("handles flash error messages", async () => {
    // Setup: Create a session with an error message
    const mockSession = {
      get: vi
        .fn()
        .mockImplementation((key) =>
          key === "error" ? "Test error message" : null,
        ),
    };

    // Mock the responses
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (commitSession as jest.Mock).mockResolvedValue("mock-session-cookie");
    (prisma.tasks.findMany as jest.Mock).mockResolvedValue(mockTasks);

    // Execute: Call the loader
    const response = await loader({
      request: new Request("http://test.com"),
    } as LoaderFunctionArgs);
    const data = await response.json();

    // Assert: Verify error handling
    expect(data.error).toBe("Test error message");
    expect(commitSession).toHaveBeenCalled();
  });

  // Test 4: Verify task sorting and limiting logic
  it("correctly sorts and limits recent tasks", async () => {
    // Setup: Basic session and task data
    const mockSession = { get: vi.fn().mockReturnValue(null) };
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.tasks.findMany as jest.Mock).mockResolvedValue(mockTasks);

    // Execute: Call the loader
    const response = await loader({
      request: new Request("http://test.com"),
    } as LoaderFunctionArgs);
    const data = await response.json();

    // Assert: Verify task sorting and limiting
    expect(data.recentTasks).toHaveLength(2);
    // Task 1 should be first due to HIGH urgency and more applications
    expect(data.recentTasks[0].id).toBe(1);
  });
});
