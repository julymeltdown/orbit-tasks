import { expect, test } from "@playwright/test";

test.describe("US3 mobile first task", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("activation CTA remains visible on mobile", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("button", { name: /Create your first task/i })).toBeVisible();
  });
});
