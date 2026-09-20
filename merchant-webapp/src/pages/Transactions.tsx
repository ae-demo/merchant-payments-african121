// wireframes.dsl: screen Transactions — Status/Method filters, a search box,
// table Date|Amount|Method|Status|Action(Refund).
import { useEffect, useState, type JSX } from "react";
import { Alert, Button, Chip, ListingTable, MenuItem, PageContent, PageTitle, TextField } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";
import { formatDateTime, formatMethod, formatMoney, statusColor, titleCase } from "../format";

type Transaction = components["schemas"]["Transaction"];
type Status = "" | "pending" | "completed" | "failed";
type Method = "" | "mobile-money" | "card";

export function TransactionsPage(): JSX.Element {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("");
  const [method, setMethod] = useState<Method>("");
  const [search, setSearch] = useState("");
  const [refunding, setRefunding] = useState<string | null>(null);
  const [refundedIds, setRefundedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function load(): void {
    setLoading(true);
    void paymentsApi
      .GET("/me/transactions", {
        params: {
          query: {
            ...(status ? { status } : {}),
            ...(method ? { method } : {}),
            limit: 50,
          },
        },
      })
      .then(({ data }) => {
        if (data) setTransactions(data.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [status, method]);

  async function handleRefund(transactionId: string): Promise<void> {
    setRefunding(transactionId);
    setError(null);
    const { error: apiError } = await paymentsApi.POST("/me/transactions/{transactionId}/refund", {
      params: { path: { transactionId } },
    });
    setRefunding(null);
    if (apiError) {
      setError(apiError.message ?? "Could not refund this transaction.");
      return;
    }
    setRefundedIds((prev) => new Set(prev).add(transactionId));
  }

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const haystack = `${formatMethod(t.method)} ${t.status} ${t.amount}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Transactions</PageTitle.Header>
      </PageTitle>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <ListingTable.Toolbar
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search"
      >
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
        </TextField>
        <TextField
          select
          label="Method"
          value={method}
          onChange={(e) => setMethod(e.target.value as Method)}
          sx={{ minWidth: 160, ml: 2 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="mobile-money">Mobile Money</MenuItem>
          <MenuItem value="card">Card</MenuItem>
        </TextField>
      </ListingTable.Toolbar>
      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Date</ListingTable.Cell>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Method</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
              <ListingTable.Cell>Action</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {filtered.length === 0 && !loading ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={5}>
                  <ListingTable.EmptyState title="No transactions found" />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              filtered.map((t) => (
                <ListingTable.Row key={t.id}>
                  <ListingTable.Cell>{formatDateTime(t.createdAt)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMoney(t.amount, t.currency)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMethod(t.method)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={titleCase(t.status)} color={statusColor(t.status)} size="small" />
                  </ListingTable.Cell>
                  <ListingTable.Cell>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={t.status !== "completed" || refunding === t.id || refundedIds.has(t.id)}
                      onClick={() => void handleRefund(t.id)}
                    >
                      {refundedIds.has(t.id) ? "Refunded" : "Refund"}
                    </Button>
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>
    </PageContent>
  );
}
