// Persistence for the `payouts` table.

import ballerina/sql;
import ballerina/time;
import ballerinax/postgresql;

type PayoutRow record {|
    string id;
    string merchantId;
    int amount;
    string currency;
    string destinationType;
    string? bankAccountNumber;
    string? bankCode;
    string? mobileWalletNumber;
    string status;
    string? externalPayoutId;
    time:Utc createdAt;
|};

function toPayout(PayoutRow row) returns Payout => {
    id: row.id,
    merchantId: row.merchantId,
    amount: row.amount,
    currency: row.currency,
    destinationType: <"bank"|"mobile-wallet">row.destinationType,
    status: <"pending"|"paid"|"failed">row.status,
    externalPayoutId: row.externalPayoutId,
    createdAt: formatUtc(row.createdAt)
};

final sql:ParameterizedQuery PAYOUT_SELECT = `SELECT id, merchant_id as "merchantId", amount, currency,
       destination_type as "destinationType", bank_account_number as "bankAccountNumber",
       bank_code as "bankCode", mobile_wallet_number as "mobileWalletNumber",
       status, external_payout_id as "externalPayoutId", created_at as "createdAt"
FROM payouts`;

function findPayoutById(string payoutId) returns PayoutRow?|error {
    postgresql:Client dbc = check dbClient();
    stream<PayoutRow, sql:Error?> rows = dbc->query(sql:queryConcat(PAYOUT_SELECT, ` WHERE id = ${payoutId}`));
    PayoutRow[] result = check from PayoutRow r in rows select r;
    check rows.close();
    return result.length() == 0 ? () : result[0];
}

function listPayoutsForMerchant(string merchantId, string? status, int 'limit, int offset)
        returns [PayoutRow[], int]|error {
    postgresql:Client dbc = check dbClient();
    sql:ParameterizedQuery whereClause = `WHERE merchant_id = ${merchantId}`;
    if status is string {
        whereClause = sql:queryConcat(whereClause, ` AND status = ${status}`);
    }
    stream<PayoutRow, sql:Error?> rows = dbc->query(sql:queryConcat(PAYOUT_SELECT, ` `, whereClause,
        ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`));
    PayoutRow[] page = check from PayoutRow r in rows select r;
    check rows.close();
    int total = check dbc->queryRow(sql:queryConcat(`SELECT COUNT(*) FROM payouts `, whereClause));
    return [page, total];
}

function listAllPayouts(string? status, int 'limit, int offset) returns [PayoutRow[], int]|error {
    postgresql:Client dbc = check dbClient();
    sql:ParameterizedQuery whereClause = status is string ? ` WHERE status = ${status}` : ``;
    stream<PayoutRow, sql:Error?> rows = dbc->query(sql:queryConcat(PAYOUT_SELECT, whereClause,
        ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`));
    PayoutRow[] page = check from PayoutRow r in rows select r;
    check rows.close();
    int total = check dbc->queryRow(sql:queryConcat(`SELECT COUNT(*) FROM payouts`, whereClause));
    return [page, total];
}

function insertPayout(string merchantId, int amount, string currency, PayoutInput input) returns PayoutRow|error {
    postgresql:Client dbc = check dbClient();
    string id = newId();
    time:Utc createdAt = nowUtc();
    string? bankAccountNumber = input?.bankAccountNumber;
    string? bankCode = input?.bankCode;
    string? mobileWalletNumber = input?.mobileWalletNumber;
    _ = check dbc->execute(`
        INSERT INTO payouts (id, merchant_id, amount, currency, destination_type, bank_account_number,
                              bank_code, mobile_wallet_number, status, created_at)
        VALUES (${id}, ${merchantId}, ${amount}, ${currency}, ${input.destinationType}, ${bankAccountNumber},
                ${bankCode}, ${mobileWalletNumber}, 'pending', ${createdAt})
    `);
    return {
        id,
        merchantId,
        amount,
        currency,
        destinationType: input.destinationType,
        bankAccountNumber,
        bankCode,
        mobileWalletNumber,
        status: "pending",
        externalPayoutId: (),
        createdAt
    };
}

# Settles a payout to its final outcome once the payments gateway answers.
#
# + payoutId - the payout to update
# + status - `paid` or `failed`
# + externalPayoutId - the gateway's own id for the payout, when it has one
# + return - an error when the update fails
function settlePayout(string payoutId, string status, string? externalPayoutId) returns error? {
    postgresql:Client dbc = check dbClient();
    _ = check dbc->execute(`
        UPDATE payouts SET status = ${status}, external_payout_id = ${externalPayoutId} WHERE id = ${payoutId}
    `);
}
