import { test, expect } from "@playwright/test";

test("login to workspace entry flow", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("user@orbit.local");
  await page.getByLabel("Password").fill("Secret123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/workspace\/select/);
  await expect(page.getByText("Select a workspace")).toBeVisible();
});
