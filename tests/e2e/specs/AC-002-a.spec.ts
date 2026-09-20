// spec: tests/validation/test-plan.md § AC-002-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";
import { loginAsAdmin } from "../lib/adminAuth";

test("AC-002-a: a Platform Admin can see a list of merchants with pending KYC status", async ({ page }) => {
  // 1. Sign in as the Platform Admin
  await page.goto(`${target("admin-webapp")}/onboarding`);
  await loginAsAdmin(page);

  // 2. The Onboarding screen is the pending-merchants list view
  await expect(page.getByRole("heading", { name: "Pending merchants" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Business" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Owner" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Country" })).toBeVisible();
});
