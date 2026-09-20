// Persistence for the `payment_links` table.

import ballerina/sql;
import ballerina/time;
import ballerinax/postgresql;

type PaymentLinkRow record {|
    string id;
    string merchantId;
    int amount;
    string currency;
    string status;
    string qrCodeUrl;
    time:Utc createdAt;
    time:Utc? expiresAt;
|};

# The status a payment link actually shows right now: `pending` flips to
# `expired` once its `expiresAt` has passed, without ever being written back
# — the transition is a read-time projection, not a stored state change.
#
# + row - the stored row
# + return - the effective status
function effectivePaymentLinkStatus(PaymentLinkRow row) returns "pending"|"paid"|"expired" {
    if row.status == "pending" {
        time:Utc? expiresAt = row.expiresAt;
        if expiresAt is time:Utc && nowUtc() > expiresAt {
            return "expired";
        }
    }
    return <"pending"|"paid"|"expired">row.status;
}

function toPaymentLink(PaymentLinkRow row) returns PaymentLink => {
    id: row.id,
    merchantId: row.merchantId,
    amount: row.amount,
    currency: row.currency,
    status: effectivePaymentLinkStatus(row),
    qrCodeUrl: row.qrCodeUrl,
    createdAt: formatUtc(row.createdAt),
    expiresAt: row.expiresAt is time:Utc ? formatUtc(<time:Utc>row.expiresAt) : ()
};

function findPaymentLinkById(string linkId) returns PaymentLinkRow?|error {
    postgresql:Client dbc = check dbClient();
    stream<PaymentLinkRow, sql:Error?> rows = dbc->query(`
        SELECT id, merchant_id as "merchantId", amount, currency, status,
               qr_code_url as "qrCodeUrl", created_at as "createdAt", expires_at as "expiresAt"
        FROM payment_links WHERE id = ${linkId}
    `);
    PaymentLinkRow[] result = check from PaymentLinkRow r in rows select r;
    check rows.close();
    return result.length() == 0 ? () : result[0];
}

# A merchant's own payment links, optionally filtered by effective status.
#
# + merchantId - the owning merchant
# + status - filter by effective status, or `()` for all
# + 'limit - page size
# + offset - page offset
# + return - [rows, totalMatching], or an error
function listPaymentLinksForMerchant(string merchantId, string? status, int 'limit, int offset)
        returns [PaymentLinkRow[], int]|error {
    postgresql:Client dbc = check dbClient();
    stream<PaymentLinkRow, sql:Error?> rows = dbc->query(`
        SELECT id, merchant_id as "merchantId", amount, currency, status,
               qr_code_url as "qrCodeUrl", created_at as "createdAt", expires_at as "expiresAt"
        FROM payment_links WHERE merchant_id = ${merchantId}
        ORDER BY created_at DESC
    `);
    PaymentLinkRow[] all = check from PaymentLinkRow r in rows select r;
    check rows.close();
    PaymentLinkRow[] filtered = status is string
        ? (from PaymentLinkRow r in all where effectivePaymentLinkStatus(r) == status select r)
        : all;
    int total = filtered.length();
    PaymentLinkRow[] page = [];
    foreach int i in offset ..< (offset + 'limit) {
        if i >= total {
            break;
        }
        page.push(filtered[i]);
    }
    return [page, total];
}

function insertPaymentLink(string merchantId, PaymentLinkInput input) returns PaymentLinkRow|error {
    postgresql:Client dbc = check dbClient();
    string id = newId();
    time:Utc createdAt = nowUtc();
    time:Utc? expiresAt = ();
    string? expiresAtText = input?.expiresAt;
    if expiresAtText is string {
        expiresAt = check parseUtc(expiresAtText);
    }
    string qrCodeUrl = string `/payment-links/${id}`;
    _ = check dbc->execute(`
        INSERT INTO payment_links (id, merchant_id, amount, currency, status, qr_code_url, created_at, expires_at)
        VALUES (${id}, ${merchantId}, ${input.amount}, ${input.currency}, 'pending', ${qrCodeUrl}, ${createdAt}, ${expiresAt})
    `);
    return {
        id,
        merchantId,
        amount: input.amount,
        currency: input.currency,
        status: "pending",
        qrCodeUrl,
        createdAt,
        expiresAt
    };
}

# Marks a payment link paid. Only the row's stored state changes; the
# derived "expired" view is never applied to a link that has just been paid.
#
# + linkId - the link to update
# + return - an error when the update fails
function markPaymentLinkPaid(string linkId) returns error? {
    postgresql:Client dbc = check dbClient();
    _ = check dbc->execute(`UPDATE payment_links SET status = 'paid' WHERE id = ${linkId}`);
}
