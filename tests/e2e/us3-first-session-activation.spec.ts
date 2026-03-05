import { expect, test } from "@playwright/test";

test.describe("US3 first-session activation", () => {
  test("shows single primary activation CTA on /app", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("button", { name: /Create your first task/i })).toBeVisible();
  });
});
