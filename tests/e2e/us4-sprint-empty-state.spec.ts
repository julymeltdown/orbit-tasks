import { expect, test } from "@playwright/test";

test.describe("US4 sprint empty-state", () => {
  test("sprint screen shows action-oriented empty state", async ({ page }) => {
    await page.goto("/app/sprint");
    await expect(page.getByText(/No active sprint/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Create Sprint/i })).toBeVisible();
  });
});
