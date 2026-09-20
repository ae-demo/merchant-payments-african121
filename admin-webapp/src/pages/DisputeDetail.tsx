// wireframes.dsl: screen DisputeDetail "Resolve one escalated dispute" —
// heading subject, text Merchant/Amount, textarea "Resolution notes", button
// "Mark resolved" primary -> Disputes.
//
// GAP: payments-api has no per-id GET for a dispute — only GET /disputes
// (list) and POST /disputes/{disputeId}/resolve — so this screen loads the
// same list operation as Disputes and finds its record by id (one bulk
// request, not one per row). The Amount line is not on Dispute either: it is
// joined from GET /payouts via the dispute's nullable payoutId.
import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PageContent,
  PageTitle,
  Typography,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Box,
  Alert,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { Can } from "../authz/gates";
import { formatMoney } from "../lib/format";
import type { components } from "../generated/payments-api";

type Dispute = components["schemas"]["Dispute"];
type Merchant = components["schemas"]["Merchant"];
type Payout = components["schemas"]["Payout"];

export default function DisputeDetailPage(): JSX.Element {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<Dispute | null | undefined>(undefined);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    paymentsApi.GET("/merchants", { params: { query: { limit: 100 } } }).then(({ data, error: apiError }) => {
      if (!live || apiError) return;
      setMerchants(data?.data ?? []);
    });
    paymentsApi.GET("/payouts", { params: { query: { limit: 100 } } }).then(({ data, error: apiError }) => {
      if (!live || apiError) return;
      setPayouts(data?.data ?? []);
    });
    paymentsApi
      .GET("/disputes", { params: { query: { limit: 100 } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError("Could not load this dispute.");
          setDispute(null);
          return;
        }
        setDispute((data?.data ?? []).find((d) => d.id === disputeId) ?? null);
      })
      .catch(() => {
        if (live) {
          setError("Could not load this dispute.");
          setDispute(null);
        }
      });
    return () => {
      live = false;
    };
  }, [disputeId]);

  const merchantName = useMemo(() => {
    const byId = new Map(merchants.map((m) => [m.id, m.businessName]));
    return (id: string) => byId.get(id) ?? id;
  }, [merchants]);

  const payoutAmount = useMemo(() => {
    if (!dispute?.payoutId) return null;
    const payout = payouts.find((p) => p.id === dispute.payoutId);
    return payout ? formatMoney(payout.amount, payout.currency) : null;
  }, [dispute, payouts]);

  async function resolve() {
    if (!disputeId) return;
    setBusy(true);
    try {
      const { error: apiError } = await paymentsApi.POST("/disputes/{disputeId}/resolve", {
        params: { path: { disputeId } },
        body: { resolutionNotes: notes },
      });
      if (apiError) {
        setError("Could not resolve this dispute.");
        return;
      }
      navigate("/disputes");
    } finally {
      setBusy(false);
    }
  }

  if (dispute === undefined) {
    return (
      <PageContent>
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      </PageContent>
    );
  }

  if (dispute === null) {
    return (
      <PageContent>
        <Alert severity="error">{error ?? "This dispute could not be found."}</Alert>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.BackButton onClick={() => navigate("/disputes")}>Back</PageTitle.BackButton>
        <PageTitle.Header>{dispute.subject}</PageTitle.Header>
      </PageTitle>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography>Merchant: {merchantName(dispute.merchantId)}</Typography>
        <Typography>Amount: {payoutAmount ?? "—"}</Typography>
      </Stack>

      <TextField
        label="Resolution notes"
        multiline
        minRows={4}
        fullWidth
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        disabled={dispute.status === "resolved"}
        sx={{ mb: 3 }}
      />

      <Can op="POST /disputes/{disputeId}/resolve">
        <Button
          variant="contained"
          disabled={busy || dispute.status === "resolved" || notes.trim().length === 0}
          onClick={() => void resolve()}
        >
          Mark resolved
        </Button>
      </Can>
    </PageContent>
  );
}
