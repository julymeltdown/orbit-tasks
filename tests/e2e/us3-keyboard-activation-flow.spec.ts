import { expect, test } from "@playwright/test";

test.describe("US3 keyboard activation flow", () => {
  test("primary activation CTA is keyboard reachable", async ({ page }) => {
    await page.goto("/app");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /Create your first task/i })).toBeVisible();
  });
});
