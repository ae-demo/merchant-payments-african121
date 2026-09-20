// Seed data and request handlers for payments-api's admin-scoped operations —
// the only ones admin-webapp calls (merchants:read-all/review,
// transactions:read-all, payouts:read-all, disputes:read-all/resolve). No
// `/me/…` operation is used by this app, so there is no per-caller row
// filtering to do here: every handler answers its path's full reach, exactly
// as GET /merchants, /transactions, /payouts and /disputes do in the real
// service.
//
// State lives in this module's scope, not a server: a full page load (a
// reload, a typed URL, leaving the SPA) re-runs this module and restores the
// seed. Only in-app navigation carries an edit forward.
//
// No scope check here — whether an operation may be called at all is
// mock/authz/gateway.ts's answer, read from openapi.yaml, exactly as it is
// the real API gateway's answer in a cell.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/payments-api";

type Merchant = components["schemas"]["Merchant"];
type Transaction = components["schemas"]["Transaction"];
type Payout = components["schemas"]["Payout"];
type Dispute = components["schemas"]["Dispute"];

// Seed rows mirror wireframes.dsl's example data (wireframes/scripts/seed.mjs
// output), mapped onto payments-api's schemas.
let merchants: Merchant[] = [
  {
    id: "merchant-1",
    businessName: "Acme Traders",
    ownerName: "Jane Doe",
    country: "Kenya",
    currency: "KES",
    contactEmail: "jane@acme.example",
    contactPhone: "+254700000001",
    kycStatus: "pending",
    balance: 0,
  },
  {
    id: "merchant-2",
    businessName: "Kampala Foods",
    ownerName: "John K.",
    country: "Uganda",
    currency: "UGX",
    contactEmail: "john@kampalafoods.example",
    contactPhone: "+256700000002",
    kycStatus: "pending",
    balance: 0,
  },
];

const transactions: Transaction[] = [
  {
    id: "txn-1",
    merchantId: "merchant-1",
    paymentLinkId: "link-1",
    method: "mobile-money",
    amount: 200_000,
    currency: "KES",
    status: "completed",
    externalPaymentId: "ext-txn-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "txn-2",
    merchantId: "merchant-2",
    paymentLinkId: "link-2",
    method: "card",
    amount: 4_000_000,
    currency: "UGX",
    status: "completed",
    externalPaymentId: "ext-txn-2",
    createdAt: new Date().toISOString(),
  },
];

const payouts: Payout[] = [
  {
    id: "payout-1",
    merchantId: "merchant-1",
    amount: 5_000_000,
    currency: "KES",
    destinationType: "bank",
    status: "paid",
    externalPayoutId: "ext-payout-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "payout-2",
    merchantId: "merchant-2",
    amount: 10_000_000,
    currency: "UGX",
    destinationType: "mobile-wallet",
    status: "failed",
    externalPayoutId: null,
    createdAt: new Date().toISOString(),
  },
];

let disputes: Dispute[] = [
  {
    id: "dispute-1",
    merchantId: "merchant-2",
    payoutId: "payout-2",
    subject: "Failed payout to mobile wallet",
    status: "open",
    resolutionNotes: null,
    createdAt: new Date().toISOString(),
  },
];

function paged<T>(items: T[], limit: number, offset: number) {
  return { count: items.length, next: null, previous: null, data: items.slice(offset, offset + limit) };
}

export const handlers = [
  http.get("/api/merchants", ({ request }) => {
    const url = new URL(request.url);
    const kycStatus = url.searchParams.get("kycStatus");
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const filtered = kycStatus ? merchants.filter((m) => m.kycStatus === kycStatus) : merchants;
    return HttpResponse.json(paged(filtered, limit, offset));
  }),

  http.get("/api/merchants/:merchantId", ({ params }) => {
    const merchant = merchants.find((m) => m.id === params.merchantId);
    return merchant
      ? HttpResponse.json(merchant)
      : HttpResponse.json({ code: 404, message: "not found" }, { status: 404 });
  }),

  http.post("/api/merchants/:merchantId/approve", ({ params }) => {
    const merchant = merchants.find((m) => m.id === params.merchantId);
    if (!merchant) return HttpResponse.json({ code: 404, message: "not found" }, { status: 404 });
    merchant.kycStatus = "approved";
    return HttpResponse.json(merchant);
  }),

  http.post("/api/merchants/:merchantId/reject", async ({ params, request }) => {
    const merchant = merchants.find((m) => m.id === params.merchantId);
    if (!merchant) return HttpResponse.json({ code: 404, message: "not found" }, { status: 404 });
    const body = (await request.json()) as { reason?: string };
    if (!body?.reason) {
      return HttpResponse.json({ code: 400, message: "reason is required" }, { status: 400 });
    }
    merchant.kycStatus = "rejected";
    return HttpResponse.json(merchant);
  }),

  http.get("/api/transactions", ({ request }) => {
    const url = new URL(request.url);
    const merchantId = url.searchParams.get("merchantId");
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const filtered = merchantId ? transactions.filter((t) => t.merchantId === merchantId) : transactions;
    return HttpResponse.json(paged(filtered, limit, offset));
  }),

  http.get("/api/payouts", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const filtered = status ? payouts.filter((p) => p.status === status) : payouts;
    return HttpResponse.json(paged(filtered, limit, offset));
  }),

  http.get("/api/disputes", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const filtered = status ? disputes.filter((d) => d.status === status) : disputes;
    return HttpResponse.json(paged(filtered, limit, offset));
  }),

  http.post("/api/disputes/:disputeId/resolve", async ({ params, request }) => {
    const dispute = disputes.find((d) => d.id === params.disputeId);
    if (!dispute) return HttpResponse.json({ code: 404, message: "not found" }, { status: 404 });
    const body = (await request.json()) as { resolutionNotes?: string };
    if (!body?.resolutionNotes) {
      return HttpResponse.json({ code: 400, message: "resolutionNotes is required" }, { status: 400 });
    }
    dispute.status = "resolved";
    dispute.resolutionNotes = body.resolutionNotes;
    return HttpResponse.json(dispute);
  }),
];
