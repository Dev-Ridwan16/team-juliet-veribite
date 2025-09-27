import { test, expect } from "@playwright/test";

test.describe("VeriBite Frontend", () => {
  test.beforeEach(async ({ page }: any) => {
    await page.goto("http://localhost:3001");
  });

  test("should display landing page correctly", async ({ page }: any) => {
    await expect(page.locator("h1")).toContainText("VeriBite");
    await expect(page.locator("text=Make predictions")).toBeVisible();
    await expect(
      page.locator('button:has-text("Connect Wallet")')
    ).toBeVisible();
  });

  test("should navigate to predictions page", async ({ page }: any) => {
    await page.click("text=View Predictions");
    await expect(page.url()).toContain("/predictions");
    await expect(page.locator("h1")).toContainText("All Predictions");
  });

  test("should navigate to admin page", async ({ page }: any: any) => {
    await page.click("text=Admin");
    await expect(page.url()).toContain("/admin");
    await expect(page.locator("h1")).toContainText("Admin Panel");
  });

  test("should show prediction form when wallet connected", async ({
    page,
  }) => {
    // Mock wallet connection
    await page.evaluate(() => {
      window.ethereum = {
        request: async () => ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
        isConnected: () => true,
      };
    });

    await page.reload();
    await expect(
      page.locator('textarea[placeholder*="prediction"]')
    ).toBeVisible();
    await expect(page.locator('input[placeholder*="stake"]')).toBeVisible();
    await expect(
      page.locator('button:has-text("Submit Prediction")')
    ).toBeVisible();
  });

  test("should validate prediction form", async ({ page }: any) => {
    // Mock wallet connection
    await page.evaluate(() => {
      window.ethereum = {
        request: async () => ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
        isConnected: () => true,
      };
    });

    await page.reload();

    // Try to submit empty form
    await page.click('button:has-text("Submit Prediction")');
    await expect(page.locator("text=Please enter a prediction")).toBeVisible();

    // Fill form with valid data
    await page.fill("textarea", "Bitcoin will reach $100k");
    await page.fill('input[placeholder*="stake"]', "0.05");

    // Form should be submittable
    await expect(
      page.locator('button:has-text("Submit Prediction")')
    ).not.toBeDisabled();
  });
});
