// wireframes.dsl: screen MerchantReview "Review one merchant's KYC details and
// approve or reject" — heading businessName, text Owner/Country/Contact,
// badge kycStatus, row[ button Reject danger -> OnboardingQueue | button
// Approve primary -> OnboardingQueue ].
//
// GAP: rejectMerchant requires a `reason` in its request body that the
// wireframe draws no control for. A small dialog captures it when Reject is
// clicked — the only way to make the drawn button actually call the endpoint
// — rather than inventing a whole new screen for it.
import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PageContent,
  PageTitle,
  Typography,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Box,
  Alert,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { Can } from "../authz/gates";
import { kycStatusColor, titleCase } from "../lib/format";
import type { components } from "../generated/payments-api";

type Merchant = components["schemas"]["Merchant"];

export default function MerchantReviewPage(): JSX.Element {
  const { merchantId } = useParams<{ merchantId: string }>();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!merchantId) return;
    let live = true;
    paymentsApi
      .GET("/merchants/{merchantId}", { params: { path: { merchantId } } })
      .then(({ data, error: apiError }) => {
        if (!live) return;
        if (apiError) {
          setError("Could not load this merchant.");
          return;
        }
        setMerchant(data ?? null);
      })
      .catch(() => live && setError("Could not load this merchant."));
    return () => {
      live = false;
    };
  }, [merchantId]);

  async function approve() {
    if (!merchantId) return;
    setBusy(true);
    try {
      const { error: apiError } = await paymentsApi.POST("/merchants/{merchantId}/approve", {
        params: { path: { merchantId } },
      });
      if (apiError) {
        setError("Could not approve this merchant.");
        return;
      }
      navigate("/onboarding");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!merchantId) return;
    setBusy(true);
    try {
      const { error: apiError } = await paymentsApi.POST("/merchants/{merchantId}/reject", {
        params: { path: { merchantId } },
        body: { reason },
      });
      if (apiError) {
        setError("Could not reject this merchant.");
        return;
      }
      setRejecting(false);
      navigate("/onboarding");
    } finally {
      setBusy(false);
    }
  }

  if (error && !merchant) {
    return (
      <PageContent>
        <Alert severity="error">{error}</Alert>
      </PageContent>
    );
  }

  if (!merchant) {
    return (
      <PageContent>
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.BackButton onClick={() => navigate("/onboarding")}>Back</PageTitle.BackButton>
        <PageTitle.Header>{merchant.businessName}</PageTitle.Header>
      </PageTitle>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography>Owner: {merchant.ownerName}</Typography>
        <Typography>Country: {merchant.country}</Typography>
        <Typography>Contact: {merchant.contactEmail ?? "—"}</Typography>
        <Chip
          label={titleCase(merchant.kycStatus)}
          color={kycStatusColor(merchant.kycStatus)}
          size="small"
          sx={{ width: "fit-content" }}
        />
      </Stack>

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Can op="POST /merchants/{merchantId}/reject">
          <Button
            variant="outlined"
            color="error"
            disabled={busy || merchant.kycStatus !== "pending"}
            onClick={() => setRejecting(true)}
          >
            Reject
          </Button>
        </Can>
        <Can op="POST /merchants/{merchantId}/approve">
          <Button
            variant="contained"
            disabled={busy || merchant.kycStatus !== "pending"}
            onClick={() => void approve()}
          >
            Approve
          </Button>
        </Can>
      </Stack>

      <Dialog open={rejecting} onClose={() => setRejecting(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject {merchant.businessName}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            minRows={3}
            fullWidth
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejecting(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={busy || reason.trim().length === 0}
            onClick={() => void reject()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </PageContent>
  );
}
