import { Page } from '@playwright/test';

export async function loginViaZitadel(page: Page, email: string, password: string) {
  // Navigate to the login page which redirects to Zitadel
  await page.goto('/zitlogin');
  // await page.locator('div').filter({ hasText: /^Sign in$/ }).getByRole('link').click();  
  // Wait for redirect to Zitadel and form to be loaded
  // await page.waitForURL(/localhost:7200/);
  // await page.waitForLoadState('networkidle');
  
  await page.getByRole('textbox', { name: 'Login Name' }).click();
  await page.getByRole('textbox', { name: 'Login Name' }).fill(email);
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Fill in credentials
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');
  // await page.getByRole('button', { name: 'Next' }).click();
  
  // Wait for successful redirect back to the application
  await page.waitForURL(/localhost:5173/, { timeout: 60000 });
}