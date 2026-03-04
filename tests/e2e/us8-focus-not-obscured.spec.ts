import { expect, test } from "@playwright/test";

test.describe("US8 focus not obscured", () => {
  test("skip link is reachable and visible on focus", async ({ page }) => {
    await page.goto("/app");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
  });
});
