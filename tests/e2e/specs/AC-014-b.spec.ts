// spec: tests/validation/test-plan.md § AC-014-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { loginAsAdmin } from "../lib/adminAuth";

test("AC-014-b: a Platform Admin can mark a dispute as resolved with resolution notes", async ({ page }) => {
  await page.goto(`${target("admin-webapp")}/disputes`);
  await loginAsAdmin(page);

  // Resolving a dispute requires at least one open dispute to act on. None
  // exists: disputes only ever arise from a failed payout, which requires a
  // Merchant identity and balance that cannot be obtained in this
  // environment - see tests/validation/test-plan.md § AC-001-a.
  // The header row and a data row share role "row"; data rows are
  // distinguished by their cells having role "cell" (header cells are
  // "columnheader"), so this excludes the header without brittle text matching.
  await expect(
    page.getByRole("row").filter({ has: page.getByRole("cell") }),
    "expected at least one open dispute row to resolve, but the disputes " +
      "list is empty - no merchant/payout activity has ever occurred",
  ).not.toHaveCount(0, { timeout: 10_000 });
});
