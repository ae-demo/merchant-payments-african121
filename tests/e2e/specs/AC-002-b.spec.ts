// spec: tests/validation/test-plan.md § AC-002-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { loginAsAdmin } from "../lib/adminAuth";

test("AC-002-b: a Platform Admin can approve a pending merchant, setting its KYC status to approved", async ({
  page,
}) => {
  await page.goto(`${target("admin-webapp")}/onboarding`);
  await loginAsAdmin(page);

  // Approving a merchant requires at least one pending merchant application
  // to act on. None exists: no Merchant identity can be created in this
  // environment - see tests/validation/test-plan.md § AC-001-a.
  // The header row and a data row share role "row"; data rows are
  // distinguished by their cells having role "cell" (header cells are
  // "columnheader"), so this excludes the header without brittle text matching.
  await expect(
    page.getByRole("row").filter({ has: page.getByRole("cell") }),
    "expected at least one pending merchant row to approve, but the pending " +
      "merchants list is empty - no Merchant has ever registered",
  ).not.toHaveCount(0, { timeout: 10_000 });
});
