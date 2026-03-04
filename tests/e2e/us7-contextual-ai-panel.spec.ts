import { expect, test } from "@playwright/test";

test.describe("US7 contextual AI panel", () => {
  test("floating launcher toggles AI panel", async ({ page }) => {
    await page.goto("/app/insights");
    await page.getByRole("button", { name: /Orbit Agent/i }).click();
    await expect(page.getByText(/Orbit Intelligence/i)).toBeVisible();
  });
});
