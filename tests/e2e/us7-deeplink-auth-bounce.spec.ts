import { test, expect } from "@playwright/test";

test.describe("US7 deep-link auth bounce", () => {
  test("navigates unauthenticated user to login and restores intent", async ({ page }) => {
    await page.goto("/dl/demo-token");

    await expect(page).toHaveURL(/\/login\?returnTo=/);
    await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
