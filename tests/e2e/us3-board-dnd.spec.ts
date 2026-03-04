import { expect, test } from "@playwright/test";

test.describe("US3 board drag/drop", () => {
  test("board lane and card render with drag handles", async ({ page }) => {
    await page.goto("/app/projects/board");
    await expect(page.getByText("Backlog")).toBeVisible();
    await expect(page.getByLabel(/Drag /).first()).toBeVisible();
  });
});
