// spec: tests/validation/test-plan.md § AC-014-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { loginAsAdmin } from "../lib/adminAuth";

test("AC-014-a: a Platform Admin can view a list of open disputes/failed payouts", async ({ page }) => {
  await page.goto(`${target("admin-webapp")}/disputes`);
  await loginAsAdmin(page);
  // Sign-in always lands on the default landing screen (Onboarding), not the
  // originally requested deep link - navigate to Disputes explicitly.
  await page.goto(`${target("admin-webapp")}/disputes`);

  await expect(page.getByRole("heading", { name: "Open disputes" })).toBeVisible();
  await expect(
    page.getByText("Escalated disputes and failed payouts awaiting resolution"),
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Merchant" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Subject" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
});
