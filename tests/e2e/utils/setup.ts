import { Page } from "@playwright/test";

export async function clearSession(page: Page) {
  // Clear all storage
  await page.context().clearCookies();
  await page.evaluate(() => window.localStorage.clear());
  await page.evaluate(() => window.sessionStorage.clear());
}
