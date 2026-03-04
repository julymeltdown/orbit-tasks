import { expect, test } from "@playwright/test";

test.describe("US5 inbox + thread + deep-link", () => {
  test("inbox page exposes notifications and requests filters", async ({ page }) => {
    await page.goto("/app/inbox");
    await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Requests" })).toBeVisible();
  });
});
