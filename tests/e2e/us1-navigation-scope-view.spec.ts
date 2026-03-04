import { expect, test } from "@playwright/test";

test.describe("US1 scope+view navigation", () => {
  test("user can open board within three clicks from app home", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: /Open Board/i }).click();
    await expect(page).toHaveURL(/\/app\/projects\/board/);
    await expect(page.getByText(/Project Views/i)).toBeVisible();
  });
});
