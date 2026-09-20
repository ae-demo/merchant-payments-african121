// wireframes.dsl: screen AllTransactions "Every transaction across all
// merchants" — row[ select "Merchant" | search "Search" ], table "Merchant |
// Amount | Method | Status | Date".
//
// Transaction rows carry merchantId, not a merchant name, so the Merchant
// column and the Merchant select are filled from one bulk GET /merchants
// request joined on id — never one request per row.
import { useEffect, useMemo, useState, type JSX } from "react";
import {
  PageContent,
  PageTitle,
  ListingTable,
  SearchBar,
  TextField,
  MenuItem,
  Stack,
  Chip,
  CircularProgress,
  Box,
  Alert,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { formatDate, formatMoney, titleCase, transactionStatusColor } from "../lib/format";
import type { components } from "../generated/payments-api";

type Transaction = components["schemas"]["Transaction"];
type Merchant = components["schemas"]["Merchant"];

const METHOD_LABEL: Record<string, string> = {
  "mobile-money": "Mobile Money",
  card: "Card",
};

export default function AllTransactionsPage(): JSX.Element {
  const [merchants, setMerchants] = useState<Merchant[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [merchantFilter, setMerchantFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    paymentsApi
      .GET("/merchants", { params: { query: { limit: 100 } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) return;
        setMerchants(data?.data ?? []);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    setTransactions(null);
    paymentsApi
      .GET("/transactions", {
        params: {
          query: {
            limit: 100,
            ...(merchantFilter ? { merchantId: merchantFilter } : {}),
          },
        },
      })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError("Could not load transactions.");
          return;
        }
        setTransactions(data?.data ?? []);
      })
      .catch(() => live && setError("Could not load transactions."));
    return () => {
      live = false;
    };
  }, [merchantFilter]);

  const merchantName = useMemo(() => {
    const byId = new Map((merchants ?? []).map((m) => [m.id, m.businessName]));
    return (id: string) => byId.get(id) ?? id;
  }, [merchants]);

  const rows = useMemo(() => {
    if (!transactions) return [];
    const query = search.trim().toLowerCase();
    if (!query) return transactions;
    return transactions.filter((t) => {
      const haystack = `${merchantName(t.merchantId)} ${METHOD_LABEL[t.method] ?? t.method} ${t.status}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [transactions, search, merchantName]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Transactions</PageTitle.Header>
        <PageTitle.SubHeader>Every transaction across all merchants</PageTitle.SubHeader>
      </PageTitle>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          label="Merchant"
          value={merchantFilter}
          onChange={(event) => setMerchantFilter(event.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All merchants</MenuItem>
          {(merchants ?? []).map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.businessName}
            </MenuItem>
          ))}
        </TextField>
        <SearchBar
          placeholder="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ flexGrow: 1 }}
        />
      </Stack>

      {!transactions && !error && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {transactions && (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Merchant</ListingTable.Cell>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Method</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Date</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {rows.map((t) => (
                <ListingTable.Row key={t.id}>
                  <ListingTable.Cell>{merchantName(t.merchantId)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMoney(t.amount, t.currency)}</ListingTable.Cell>
                  <ListingTable.Cell>{METHOD_LABEL[t.method] ?? t.method}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={titleCase(t.status)} color={transactionStatusColor(t.status)} size="small" />
                  </ListingTable.Cell>
                  <ListingTable.Cell>{formatDate(t.createdAt)}</ListingTable.Cell>
                </ListingTable.Row>
              ))}
            </ListingTable.Body>
          </ListingTable>
          {rows.length === 0 && (
            <ListingTable.EmptyState
              title="No transactions"
              description="No transactions match the current filters."
            />
          )}
        </ListingTable.Container>
      )}
    </PageContent>
  );
}
