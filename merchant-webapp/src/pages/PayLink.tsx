// wireframes.dsl: screen PayLink (F2, public, no sign-in) — heading "Pay
// {merchant}", "Amount due", "Pay with Mobile Money" primary -> PayMobileMoney,
// "Pay with Card" -> PayCard.
//
// Public: security: [] on GET /payment-links/{linkId}. Uses the same
// paymentsApi client as every signed-in screen — accessToken() simply
// resolves to null with no stored session, so the call goes out with no
// bearer, exactly as a public operation expects.
import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, PageContent, PageTitle, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";
import { formatMoney, titleCase } from "../format";

type PaymentLinkPublic = components["schemas"]["PaymentLinkPublic"];

export function PayLinkPage(): JSX.Element {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<PaymentLinkPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!linkId) return;
    let live = true;
    void paymentsApi
      .GET("/payment-links/{linkId}", { params: { path: { linkId } } })
      .then(({ data, error }) => {
        if (!live) return;
        if (data) setLink(data);
        else if (error) setNotFound(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [linkId]);

  if (loading) {
    return (
      <PageContent maxWidth={480}>
        <Typography>Loading…</Typography>
      </PageContent>
    );
  }

  if (notFound || !link) {
    return (
      <PageContent maxWidth={480}>
        <Alert severity="error">This payment link could not be found.</Alert>
      </PageContent>
    );
  }

  if (link.status !== "pending") {
    return (
      <PageContent maxWidth={480}>
        <PageTitle>
          <PageTitle.Header>Pay {link.merchantName}</PageTitle.Header>
        </PageTitle>
        <Alert severity={link.status === "paid" ? "success" : "warning"}>
          {link.status === "paid" ? "This payment link has already been paid." : "This payment link has expired."}
        </Alert>
      </PageContent>
    );
  }

  return (
    <PageContent maxWidth={480}>
      <PageTitle>
        <PageTitle.Header>Pay {link.merchantName}</PageTitle.Header>
      </PageTitle>
      <Typography sx={{ mb: 3 }}>Amount due: {formatMoney(link.amount, link.currency)}</Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate(`/pay/${linkId}/mobile-money`, { state: { merchantName: link.merchantName } })}
        >
          Pay with Mobile Money
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate(`/pay/${linkId}/card`, { state: { merchantName: link.merchantName } })}
        >
          Pay with Card
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
        Status: {titleCase(link.status)}
      </Typography>
    </PageContent>
  );
}
