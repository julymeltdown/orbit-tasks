import { expect, test } from "@playwright/test";

test.describe("US3 guided core workflow", () => {
  test("board empty state shows direct next actions", async ({ page }) => {
    await page.goto("/app/projects/board");
    await expect(page.getByText(/No tasks yet/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Create first task/i })).toBeVisible();
  });
});
