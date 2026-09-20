// Persistence for the `transactions` table.

import ballerina/sql;
import ballerina/time;
import ballerinax/postgresql;

type TransactionRow record {|
    string id;
    string merchantId;
    string paymentLinkId;
    string method;
    int amount;
    string currency;
    string status;
    string? externalPaymentId;
    time:Utc createdAt;
|};

function toTransaction(TransactionRow row) returns Transaction => {
    id: row.id,
    merchantId: row.merchantId,
    paymentLinkId: row.paymentLinkId,
    method: <"mobile-money"|"card">row.method,
    amount: row.amount,
    currency: row.currency,
    status: <"pending"|"completed"|"failed">row.status,
    externalPaymentId: row.externalPaymentId,
    createdAt: formatUtc(row.createdAt)
};

function findTransactionById(string transactionId) returns TransactionRow?|error {
    postgresql:Client dbc = check dbClient();
    stream<TransactionRow, sql:Error?> rows = dbc->query(`
        SELECT id, merchant_id as "merchantId", payment_link_id as "paymentLinkId", method, amount, currency,
               status, external_payment_id as "externalPaymentId", created_at as "createdAt"
        FROM transactions WHERE id = ${transactionId}
    `);
    TransactionRow[] result = check from TransactionRow r in rows select r;
    check rows.close();
    return result.length() == 0 ? () : result[0];
}

# A transaction owned by a specific merchant — used by the `/me/...` refund
# handler, so a transaction belonging to someone else is simply not found.
#
# + transactionId - the transaction's id
# + merchantId - the owning merchant
# + return - the row, `()` when it does not exist or belongs to another merchant, or an error
function findTransactionForMerchant(string transactionId, string merchantId) returns TransactionRow?|error {
    postgresql:Client dbc = check dbClient();
    stream<TransactionRow, sql:Error?> rows = dbc->query(`
        SELECT id, merchant_id as "merchantId", payment_link_id as "paymentLinkId", method, amount, currency,
               status, external_payment_id as "externalPaymentId", created_at as "createdAt"
        FROM transactions WHERE id = ${transactionId} AND merchant_id = ${merchantId}
    `);
    TransactionRow[] result = check from TransactionRow r in rows select r;
    check rows.close();
    return result.length() == 0 ? () : result[0];
}

function listTransactionsForMerchant(string merchantId, string? status, string? method, int 'limit, int offset)
        returns [TransactionRow[], int]|error {
    postgresql:Client dbc = check dbClient();
    sql:ParameterizedQuery whereClause = `WHERE merchant_id = ${merchantId}`;
    if status is string {
        whereClause = sql:queryConcat(whereClause, ` AND status = ${status}`);
    }
    if method is string {
        whereClause = sql:queryConcat(whereClause, ` AND method = ${method}`);
    }
    stream<TransactionRow, sql:Error?> rows = dbc->query(sql:queryConcat(
        `SELECT id, merchant_id as "merchantId", payment_link_id as "paymentLinkId", method, amount, currency,
                status, external_payment_id as "externalPaymentId", created_at as "createdAt"
         FROM transactions `, whereClause,
        ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`));
    TransactionRow[] page = check from TransactionRow r in rows select r;
    check rows.close();
    int total = check dbc->queryRow(sql:queryConcat(`SELECT COUNT(*) FROM transactions `, whereClause));
    return [page, total];
}

# Every transaction, optionally scoped to one merchant — the admin-wide view.
#
# + merchantId - filter, or `()` for every merchant
# + 'limit - page size
# + offset - page offset
# + return - [rows, totalMatching], or an error
function listAllTransactions(string? merchantId, int 'limit, int offset) returns [TransactionRow[], int]|error {
    postgresql:Client dbc = check dbClient();
    sql:ParameterizedQuery whereClause = merchantId is string ? ` WHERE merchant_id = ${merchantId}` : ``;
    stream<TransactionRow, sql:Error?> rows = dbc->query(sql:queryConcat(
        `SELECT id, merchant_id as "merchantId", payment_link_id as "paymentLinkId", method, amount, currency,
                status, external_payment_id as "externalPaymentId", created_at as "createdAt"
         FROM transactions`, whereClause,
        ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`));
    TransactionRow[] page = check from TransactionRow r in rows select r;
    check rows.close();
    int total = check dbc->queryRow(sql:queryConcat(`SELECT COUNT(*) FROM transactions`, whereClause));
    return [page, total];
}

function insertTransaction(string merchantId, string paymentLinkId, string method, int amount, string currency)
        returns TransactionRow|error {
    postgresql:Client dbc = check dbClient();
    string id = newId();
    time:Utc createdAt = nowUtc();
    _ = check dbc->execute(`
        INSERT INTO transactions (id, merchant_id, payment_link_id, method, amount, currency, status, created_at)
        VALUES (${id}, ${merchantId}, ${paymentLinkId}, ${method}, ${amount}, ${currency}, 'pending', ${createdAt})
    `);
    return {
        id,
        merchantId,
        paymentLinkId,
        method,
        amount,
        currency,
        status: "pending",
        externalPaymentId: (),
        createdAt
    };
}

# Settles a transaction to its final outcome once the payment gateway answers.
#
# + transactionId - the transaction to update
# + status - `completed` or `failed`
# + externalPaymentId - the gateway's own id for the payment, when it has one
# + return - an error when the update fails
function settleTransaction(string transactionId, string status, string? externalPaymentId) returns error? {
    postgresql:Client dbc = check dbClient();
    _ = check dbc->execute(`
        UPDATE transactions SET status = ${status}, external_payment_id = ${externalPaymentId}
        WHERE id = ${transactionId}
    `);
}
