// Persistence for the `disputes` table.

import ballerina/sql;
import ballerina/time;
import ballerinax/postgresql;

type DisputeRow record {|
    string id;
    string merchantId;
    string? payoutId;
    string subject;
    string status;
    string? resolutionNotes;
    time:Utc createdAt;
|};

function toDispute(DisputeRow row) returns Dispute => {
    id: row.id,
    merchantId: row.merchantId,
    payoutId: row.payoutId,
    subject: row.subject,
    status: <"open"|"resolved">row.status,
    resolutionNotes: row.resolutionNotes,
    createdAt: formatUtc(row.createdAt)
};

function findDisputeById(string disputeId) returns DisputeRow?|error {
    postgresql:Client dbc = check dbClient();
    stream<DisputeRow, sql:Error?> rows = dbc->query(`
        SELECT id, merchant_id as "merchantId", payout_id as "payoutId", subject, status,
               resolution_notes as "resolutionNotes", created_at as "createdAt"
        FROM disputes WHERE id = ${disputeId}
    `);
    DisputeRow[] result = check from DisputeRow r in rows select r;
    check rows.close();
    return result.length() == 0 ? () : result[0];
}

function listDisputes(string? status, int 'limit, int offset) returns [DisputeRow[], int]|error {
    postgresql:Client dbc = check dbClient();
    sql:ParameterizedQuery whereClause = status is string ? ` WHERE status = ${status}` : ``;
    stream<DisputeRow, sql:Error?> rows = dbc->query(sql:queryConcat(
        `SELECT id, merchant_id as "merchantId", payout_id as "payoutId", subject, status,
                resolution_notes as "resolutionNotes", created_at as "createdAt"
         FROM disputes`, whereClause,
        ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`));
    DisputeRow[] page = check from DisputeRow r in rows select r;
    check rows.close();
    int total = check dbc->queryRow(sql:queryConcat(`SELECT COUNT(*) FROM disputes`, whereClause));
    return [page, total];
}

# Opens a dispute for a failed payout.
#
# + merchantId - the payout's merchant
# + payoutId - the failed payout
# + subject - a short human-readable description
# + return - the created row, or an error
function insertDispute(string merchantId, string payoutId, string subject) returns DisputeRow|error {
    postgresql:Client dbc = check dbClient();
    string id = newId();
    time:Utc createdAt = nowUtc();
    _ = check dbc->execute(`
        INSERT INTO disputes (id, merchant_id, payout_id, subject, status, created_at)
        VALUES (${id}, ${merchantId}, ${payoutId}, ${subject}, 'open', ${createdAt})
    `);
    return {id, merchantId, payoutId, subject, status: "open", resolutionNotes: (), createdAt};
}

function resolveDisputeRow(string disputeId, string resolutionNotes) returns error? {
    postgresql:Client dbc = check dbClient();
    _ = check dbc->execute(`
        UPDATE disputes SET status = 'resolved', resolution_notes = ${resolutionNotes} WHERE id = ${disputeId}
    `);
}

# Resolves every open dispute for a payout — used when the payout itself is
# resolved (paid) by an admin, so a stale open dispute does not linger.
#
# + payoutId - the payout whose disputes are closing
# + resolutionNotes - the note to record on each
# + return - an error when the update fails
function resolveOpenDisputesForPayout(string payoutId, string resolutionNotes) returns error? {
    postgresql:Client dbc = check dbClient();
    _ = check dbc->execute(`
        UPDATE disputes SET status = 'resolved', resolution_notes = ${resolutionNotes}
        WHERE payout_id = ${payoutId} AND status = 'open'
    `);
}
