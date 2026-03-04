import { expect, test } from "@playwright/test";

test.describe("US9 admin access control", () => {
  test("non-admin route guard shows access requirement", async ({ page }) => {
    await page.goto("/app/admin/compliance");
    await expect(page.getByText(/Admin Access Required/i)).toBeVisible();
  });
});
