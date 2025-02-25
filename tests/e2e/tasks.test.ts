import { test, expect } from "@playwright/test";
import { loginViaZitadel } from "./utils/auth";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Verify environment variables are present
const volunteer_email = process.env.TEST_USER_EMAIL_VOLUNTEER;
const charity_email = process.env.TEST_USER_EMAIL_CHARITY;
const volunteer_password = process.env.TEST_USER_PASSWORD_VOLUNTEER;
const charity_password = process.env.TEST_USER_PASSWORD_CHARITY;

if (
  !volunteer_email ||
  !volunteer_password ||
  !charity_email ||
  !charity_password
) {
  throw new Error(
    "Missing TEST_USER_EMAIL_VOLUNTEER, TEST_USER_PASSWORD_VOLUNTEER, TEST_USER_EMAIL_CHARITY, or TEST_USER_PASSWORD_CHARITY in environment variables",
  );
}

test.describe("Task Management Flows", () => {
  test.describe("Volunteer Flow", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaZitadel(page, volunteer_email, volunteer_password);
    });

    test("1. should display task details", async ({ page }) => {
      // Navigate to manage tasks through dashboard

      await page
        .getByTestId("dashboard-nav")
        .getByRole("link", { name: "Tasks" })
        .click();
      // Click and verify specific task details

      await page
        .getByRole("button", { name: "Website Redesign for Non-" })
        .click();

      // Verify task content is visible
      await expect(
        page.getByTestId("banner-items").getByText("Website Redesign for Non-"),
      ).toBeVisible();
      await expect(
        page.getByTestId("banner-items").getByText("INCOMPLETE"),
      ).toBeVisible();
      await expect(
        page.getByTestId("banner-items").getByText("Saving Seas"),
      ).toBeVisible();

      // Verify task metadata
      expect(
        page
          .locator("div")
          .filter({ hasText: /^Team Size1volunteer needed$/ })
          .locator("div")
          .first(),
      ).toBeVisible();
      // Verify skills/categories are displayed
      await expect(page.getByText("React")).toBeVisible();
      await expect(page.getByText("Education")).toBeVisible();

      // Verify task status
    });

    // Sequential tests for volunteer actions
    test.describe.serial("Application Flow", () => {
      test("2. should apply to task", async ({ page }) => {
        await page.getByRole("link", { name: "Explore" }).first().click();
        await page
          .getByRole("button", { name: "Fund raising LOW Community" })
          .click();
        await page.getByRole("button", { name: "volunteer for task" }).click();
        await expect(page.getByText("Application submitted")).toBeVisible();
        await expect(
          page.getByRole("button", { name: "withdraw from task" }),
        ).toBeVisible();

        await page.getByRole("button", { name: "Close modal" }).click();
        await page.keyboard.press("PageUp");
        await page.getByRole("button", { name: "Menu" }).click();
        await page.getByRole("link", { name: "Dashboard" }).click();
        await page.getByRole("link", { name: "Fund raising PENDING" }).click();
        await page.getByRole("button", { name: "applications" }).click();
        await page
          .getByRole("button", { name: "Fund raising Due: 2/23/2025" })
          .click();

        await expect(
          page.getByRole("button", { name: "withdraw" }),
        ).toBeVisible();
      });

      test("3. should withdraw task application", async ({ page }) => {
        await page
          .getByTestId("dashboard-nav")
          .getByRole("link", { name: "Dashboard" })
          .click();
        await page.getByRole("link", { name: "Fund raising PENDING" }).click();
        await page.getByRole("button", { name: "applications" }).click();

        await page
          .getByRole("button", { name: "Fund raising Due: 2/23/2025" })
          .click();

        await page.getByRole("button", { name: "withdraw" }).click();

        await expect(
          page.getByRole("button", { name: "delete-application" }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "reapply" }),
        ).toBeVisible();
      });

      test("4. should delete task application", async ({ page }) => {
        await page
          .getByTestId("dashboard-nav")
          .getByRole("link", { name: "Dashboard" })
          .click();
        await page
          .getByRole("link", {
            name: /Fund raising (WITHDRAWN|REJECTED|PENDING)/i,
          })
          .click();
        await page.getByRole("button", { name: "applications" }).click();
        await page
          .getByRole("button", { name: "Fund raising Due: 2/23/2025" })
          .click();
        await page.getByRole("button", { name: "delete-application" }).click();
        await expect(
          page.getByRole("button", { name: "Fund raising Due: 2/23/2025" }),
        ).not.toBeVisible();
      });
    });
  });

  test.describe("Charity Flow", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaZitadel(page, charity_email, charity_password);
    });

    // Sequential tests for task management
    test.describe.serial("Task Creation and Management", () => {
      test("1. should create task", async ({ page }) => {
        // Navigate to task creation through dashboard
        await page
          .getByTestId("dashboard-nav")
          .getByRole("link", { name: "Manage Tasks" })
          .click();
        await page.getByRole("button", { name: "create-task" }).click();

        // Fill in task details
        await page.getByRole("textbox", { name: "title" }).click();
        await page
          .getByRole("textbox", { name: "title" })
          .fill("Build an Accessible Website for a Animal Shelter");

        // Add impact
        await page.getByRole("textbox", { name: "impact" }).click();
        await page
          .getByRole("textbox", { name: "impact" })
          .fill("This task will help the animal shelter reach more potential");

        // Add description
        await page.getByRole("textbox", { name: "description" }).click();
        await page
          .getByRole("textbox", { name: "description" })
          .fill(
            "Develop a user-friendly and accessible website with pet adoption listings, donation options, and volunteer sign-up forms",
          );

        // Add technical skills
        await page
          .getByRole("textbox", { name: "Enter a technical Skill (4" })
          .fill("W");
        await page.getByRole("button", { name: "AWS" }).click();

        // Select category
        await page
          .getByRole("textbox", { name: "Enter the charitable category" })
          .fill("ANIM");
        await page.getByRole("button", { name: "Animal Shelters" }).click();

        // Set team size and urgency
        await page.getByRole("spinbutton", { name: "volunteers" }).fill("2");
        await page.getByRole("button", { name: "Low" }).click();
        await page.getByRole("option", { name: "Medium" }).click();

        // Set deadline
        await page
          .getByRole("textbox", { name: "deadline" })
          .fill("2025-03-27");

        // Add deliverables
        await page
          .getByRole("textbox", { name: "Enter a deliverable (5" })
          .fill("Fully functional website with adoption listings");
        await page
          .locator("div")
          .filter({ hasText: /^DeliverablesAdd$/ })
          .getByRole("button")
          .click();

        // Upload files with correct path
        const testImagePath = path.join(__dirname, "fixtures", "ghibli.png");

        // Target the specific file input (the first one, which is for single files)
        const fileInput = page.locator('input[name="files[]"]').first();

        // First file upload
        await page.getByRole("button", { name: "browse files" }).click();
        await page.getByRole("tab", { name: "My Device" }).click();
        await fileInput.setInputFiles(testImagePath);
        await page.getByRole("button", { name: "Upload 1 file" }).click();

        // Submit the task
        await page.getByRole("button", { name: "Submit task form" }).click();

        // Verify task was created using a more specific selector
        await page
          .getByRole("button", { name: "Build an Accessible Website" })
          .click();

        await expect(
          page.locator(
            'p[data-testid="banner-item-value"][title="Build an Accessible Website for a Animal Shelter"]',
          ),
        ).toBeVisible();

        // Additional verifications for other task details
        await expect(page.getByText("Animal Shelters")).toBeVisible();
        await expect(page.getByText("AWS")).toBeVisible();
      });

      test("2. should display task details", async ({ page }) => {
        // Navigate to manage tasks through dashboard
        await page
          .getByTestId("dashboard-nav")
          .getByRole("link", { name: "Manage Tasks" })
          .click();
        await page.getByRole("button", { name: "Menu" }).click();

        // Click and verify specific task details
        await page
          .getByRole("button", { name: "Homelessness Due: 3/2/2025" })
          .click();

        // Verify task content is visible
        await expect(
          page.getByTestId("banner-items").getByText("Homelessness"),
        ).toBeVisible();
        await expect(page.getByText("Reduce homelessness")).toBeVisible();
        await expect(page.getByText("Provide shelter for")).toBeVisible();

        // Verify task metadata
        await expect(
          page.getByText("Team Size2volunteers needed"),
        ).toBeVisible();

        // Verify skills/categories are displayed
        await expect(page.getByText("Node.js")).toBeVisible();
        await expect(page.getByText("Medical Research")).toBeVisible();

        // Verify task status
        await expect(
          page.getByRole("button", { name: "Not Started" }),
        ).toBeVisible();
      });

      test("3. should perform task application actions", async ({ page }) => {
        await page
          .getByTestId("dashboard-nav")
          .getByRole("link", { name: "Manage Tasks" })
          .click();
        await page
          .getByRole("button", { name: "Fund raising Due: 2/23/2025" })
          .click();

        await page.getByRole("button", { name: "Wesley Snipes" }).click();
        await page.getByRole("button", { name: "accept application" }).click();

        await expect(page.getByTestId("application-status")).toHaveText(
          "ACCEPTED",
        );

        await page.getByRole("button", { name: "undo accept status" }).click();
        await expect(page.getByTestId("application-status")).toHaveText(
          "PENDING",
        );

        await page.getByRole("button", { name: "reject application" }).click();
        await expect(page.getByText("No applicants yet")).toBeVisible();
      });

      test("4. should filter tasks by text search", async ({ page }) => {
        // Navigate to tasks through dashboard
        await page
          .getByTestId("dashboard-nav")
          .getByRole("link", { name: "Manage Tasks" })
          .click();

        // Open filter menu
        await page.getByRole("button", { name: "Menu" }).click();
        // Select specific category from dropdown
        await page.getByRole("textbox", { name: "Search" }).nth(1).fill("Fund");

        // Select specific category from dropdown
        await page
          .getByRole("button", { name: "Fund raising Due: 2/23/2025" })
          .click();
        // Verify filtered results
        await expect(
          page.getByTestId("banner-items").getByText("Fund raising"),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Homelessness Due: 3/2/2025" }),
        ).not.toBeVisible();

        // Clear filter and verify all tasks are shown again
        await page.getByRole("textbox", { name: "Search" }).nth(1).fill("");
        await expect(
          page.getByRole("button", { name: "Homelessness Due: 3/2/2025" }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Fund raising Due: 2/23/2025" }),
        ).toBeVisible();
      });

      test("5. should delete task", async ({ page }) => {
        // Navigate to manage tasks through dashboard
        await page
          .getByTestId("dashboard-nav")
          .getByRole("link", { name: "Manage Tasks" })
          .click();

        // Find and click on the task we created
        await page
          .getByRole("button", { name: "Build an Accessible Website" })
          .click();

        // Verify we're on the correct task page
        await expect(
          page.locator(
            'p[data-testid="banner-item-value"][title="Build an Accessible Website for a Animal Shelter"]',
          ),
        ).toBeVisible();

        // Click delete button and handle confirmation
        await page.getByRole("button", { name: "delete" }).click();

        // Handle the confirmation dialog
        // await page.getByRole('button', { name: 'Confirm Delete' }).click();

        // Verify success message
        // await expect(page.getByTestId('delete-success')).toBeVisible();

        // Verify task no longer exists in the list
        await expect(
          page.getByRole("button", { name: "Build an Accessible Website" }),
        ).not.toBeVisible();
      });
    });
  });
});
