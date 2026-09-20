// wireframes.dsl: screen Disputes "Escalated disputes and failed payouts
// awaiting resolution" — table "Merchant | Subject | Status" -> DisputeDetail.
//
// GAP: Dispute carries merchantId, not a merchant name; joined here from one
// bulk GET /merchants request, as AllTransactions and AllPayouts do.
import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageContent,
  PageTitle,
  ListingTable,
  Chip,
  CircularProgress,
  Box,
  Alert,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { disputeStatusColor, titleCase } from "../lib/format";
import type { components } from "../generated/payments-api";

type Dispute = components["schemas"]["Dispute"];
type Merchant = components["schemas"]["Merchant"];

export default function DisputesPage(): JSX.Element {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<Merchant[] | null>(null);
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    paymentsApi.GET("/merchants", { params: { query: { limit: 100 } } }).then(({ data, error: apiError }) => {
      if (!live || apiError) return;
      setMerchants(data?.data ?? []);
    });
    paymentsApi
      .GET("/disputes", { params: { query: { limit: 100 } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError("Could not load disputes.");
          return;
        }
        setDisputes(data?.data ?? []);
      })
      .catch(() => live && setError("Could not load disputes."));
    return () => {
      live = false;
    };
  }, []);

  const merchantName = useMemo(() => {
    const byId = new Map((merchants ?? []).map((m) => [m.id, m.businessName]));
    return (id: string) => byId.get(id) ?? id;
  }, [merchants]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Open disputes</PageTitle.Header>
        <PageTitle.SubHeader>Escalated disputes and failed payouts awaiting resolution</PageTitle.SubHeader>
      </PageTitle>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!disputes && !error && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {disputes && (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Merchant</ListingTable.Cell>
                <ListingTable.Cell>Subject</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {disputes.map((d) => (
                <ListingTable.Row key={d.id} clickable onClick={() => navigate(`/disputes/${d.id}`)}>
                  <ListingTable.Cell>{merchantName(d.merchantId)}</ListingTable.Cell>
                  <ListingTable.Cell>{d.subject}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip label={titleCase(d.status)} color={disputeStatusColor(d.status)} size="small" />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))}
            </ListingTable.Body>
          </ListingTable>
          {disputes.length === 0 && (
            <ListingTable.EmptyState title="No open disputes" description="Nothing is awaiting resolution." />
          )}
        </ListingTable.Container>
      )}
    </PageContent>
  );
}
