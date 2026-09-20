// Persistence for the `refunds` table.
//
// internal-payments publishes no reversal/refund operation of its own (its
// contract has only /payments and /payouts), so a refund here is an internal
// bookkeeping record plus a balance adjustment — there is no external call
// to make.

import ballerina/time;
import ballerinax/postgresql;

type RefundRow record {|
    string id;
    string transactionId;
    int amount;
    string status;
    time:Utc createdAt;
|};

function toRefund(RefundRow row) returns Refund => {
    id: row.id,
    transactionId: row.transactionId,
    amount: row.amount,
    status: <"pending"|"completed"|"failed">row.status,
    createdAt: formatUtc(row.createdAt)
};

# Whether a transaction has already been refunded.
#
# + transactionId - the transaction to check
# + return - true when a non-failed refund already exists for it, or an error
function hasCompletedRefund(string transactionId) returns boolean|error {
    postgresql:Client dbc = check dbClient();
    int count = check dbc->queryRow(`
        SELECT COUNT(*) FROM refunds WHERE transaction_id = ${transactionId} AND status = 'completed'
    `);
    return count > 0;
}

function insertRefund(string transactionId, int amount) returns RefundRow|error {
    postgresql:Client dbc = check dbClient();
    string id = newId();
    time:Utc createdAt = nowUtc();
    _ = check dbc->execute(`
        INSERT INTO refunds (id, transaction_id, amount, status, created_at)
        VALUES (${id}, ${transactionId}, ${amount}, 'completed', ${createdAt})
    `);
    return {id, transactionId, amount, status: "completed", createdAt};
}
