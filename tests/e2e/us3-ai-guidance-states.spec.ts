import { expect, test } from "@playwright/test";

test.describe("US3 AI guidance states", () => {
  test("insights page displays explainable status and confidence", async ({ page }) => {
    await page.goto("/app/insights");
    await expect(page.getByText(/AI Coaching/i)).toBeVisible();
    await expect(page.getByText(/Confidence/i)).toBeVisible();
  });
});
