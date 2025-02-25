import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Skillanthropy/);
  });

  test('should display recent tasks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="popular-tasks"]')).toBeVisible();
  });


});
