import { expect, test } from "@playwright/test";

test.describe("US3 progressive disclosure", () => {
  test("advanced navigation is disclosed via More toggle", async ({ page }) => {
    await page.goto("/app");
    const more = page.getByRole("button", { name: /More/i }).first();
    await expect(more).toBeVisible();
    await more.click();
    await expect(page.getByText(/Hide Advanced/i)).toBeVisible();
  });
});
