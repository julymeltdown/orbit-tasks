import { expect, test } from "@playwright/test";

test.describe("US8 mobile menu accessibility", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("menu button opens global navigation", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation", { name: "Scope navigation" })).toBeVisible();
  });
});
