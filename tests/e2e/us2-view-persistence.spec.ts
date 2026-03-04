import { expect, test } from "@playwright/test";

test.describe("US2 multi-view persistence", () => {
  test("switching board->table preserves project scope", async ({ page }) => {
    await page.goto("/app/projects/board");
    await page.getByRole("tab", { name: "Table" }).click();
    await expect(page).toHaveURL(/\/app\/projects\/table/);
    await expect(page.getByRole("tab", { name: "Table" })).toHaveAttribute("aria-selected", "true");
  });
});
