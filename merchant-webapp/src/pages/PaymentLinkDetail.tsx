// wireframes.dsl: screen PaymentLinkDetail — QR code image, the shareable
// link text, a status badge, "Back to dashboard" -> Dashboard.
import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Chip, PageContent, PageTitle, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";
import { statusColor, titleCase } from "../format";

type PaymentLink = components["schemas"]["PaymentLink"];

export function PaymentLinkDetailPage(): JSX.Element {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!linkId) return;
    let live = true;
    void paymentsApi
      .GET("/me/payment-links/{linkId}", { params: { path: { linkId } } })
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

  const payUrl = linkId ? `${window.location.origin}/pay/${linkId}` : "";

  return (
    <PageContent maxWidth={480}>
      <PageTitle>
        <PageTitle.Header>Payment link ready</PageTitle.Header>
      </PageTitle>
      {loading ? (
        <Typography>Loading…</Typography>
      ) : notFound || !link ? (
        <Typography color="error">This payment link could not be found.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
          <Box
            component="img"
            src={link.qrCodeUrl}
            alt="QR code"
            sx={{ width: 200, height: 200, bgcolor: "background.default", border: 1, borderColor: "divider" }}
          />
          <Typography sx={{ wordBreak: "break-all" }}>{payUrl}</Typography>
          <Chip label={titleCase(link.status)} color={statusColor(link.status)} size="small" />
        </Box>
      )}
      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => navigate("/dashboard")}>
          Back to dashboard
        </Button>
      </Box>
    </PageContent>
  );
}
