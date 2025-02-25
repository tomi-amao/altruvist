import { test, expect } from "@playwright/test";
import { loginViaZitadel } from "./utils/auth";

const valid_email = process.env.TEST_USER_EMAIL_VOLUNTEER;
const valid_password = process.env.TEST_USER_PASSWORD_VOLUNTEER;

if (!valid_email || !valid_password) {
  throw new Error(
    "Missing TEST_USER_EMAIL_VOLUNTEER or TEST_USER_PASSWORD_VOLUNTEER in environment variables",
  );
}
test.describe("Authentication with Zitadel", () => {
  test("should redirect to Zitadel login page", async ({ page }) => {
    await page.goto("/zitlogin");
    await expect(page).toHaveURL(/localhost:7200/);
    await expect(page.locator("form")).toBeVisible();
  });

  test("should show error on invalid email", async ({ page }) => {
    await page.goto("/zitlogin");

    await page.getByRole("textbox", { name: "Login Name" }).click();
    await page
      .getByRole("textbox", { name: "Login Name" })
      .fill("incorrect@live.co.uk");
    await page.getByRole("button", { name: "Next" }).click();

    await expect(page.getByText("User could not be found")).toBeVisible();
  });
  test("should show error on invalid password", async ({ page }) => {
    await page.goto("/zitlogin");

    await page.getByRole("textbox", { name: "Login Name" }).click();
    await page
      .getByRole("textbox", { name: "Login Name" })
      .fill("incorrect@live.co.uk");
    await page.getByRole("button", { name: "Next" }).click();

    await page
      .getByRole("textbox", { name: "Password" })
      .fill("IncorrectPassword");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("Password is invalid")).toBeVisible();
  });

  test("should successfully login and redirect back", async ({ page }) => {
    await loginViaZitadel(page, valid_email, valid_password);

    // Should be back on our app
    await expect(page).toHaveURL("http://localhost:5173/dashboard");
    // Verify login success (e.g., user menu presence)
    await expect(page.locator('[data-testid="dashboard-nav"]')).toBeVisible();
  });

  test("should log out successfully", async ({ page }) => {
    await loginViaZitadel(page, valid_email, valid_password);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("link", { name: "Logout" }).click();
    await expect(
      page.getByRole("heading", { name: "Donate your digital skills" }),
    ).toBeVisible();
  });
});
