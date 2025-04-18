import { chromium } from "@playwright/test";

async function globalSetup() {
  const browser = await chromium.launch();

  await browser.close();
}

export default globalSetup;
