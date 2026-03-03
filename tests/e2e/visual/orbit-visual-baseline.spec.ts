import { test, expect } from "@playwright/test";

test.describe("Phase14 visual baseline", () => {
  test("captures light and dark responsive baselines", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page).toHaveScreenshot("orbit-desktop-light.png", { fullPage: true });

    await page.evaluate(() => {
      localStorage.setItem("orbit.theme", "dark");
    });
    await page.reload();
    await expect(page).toHaveScreenshot("orbit-desktop-dark.png", { fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page).toHaveScreenshot("orbit-mobile-dark.png", { fullPage: true });
  });
});
