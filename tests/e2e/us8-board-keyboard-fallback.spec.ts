import { expect, test } from "@playwright/test";

test.describe("US8 board keyboard fallback", () => {
  test("board cards expose keyboard move affordance", async ({ page }) => {
    await page.goto("/app/projects/board");
    await expect(page.getByRole("button", { name: /Move with keyboard/i }).first()).toBeVisible();
  });
});
