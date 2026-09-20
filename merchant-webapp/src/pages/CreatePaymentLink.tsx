// wireframes.dsl: screen CreatePaymentLink — Amount input, Currency select,
// Cancel -> Dashboard, "Generate link" primary -> PaymentLinkDetail.
import { useEffect, useState, type JSX, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Form, MenuItem, PageContent, PageTitle, TextField } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";

const CURRENCIES = ["KES", "NGN", "GHS", "UGX", "TZS", "ZAR", "USD"];

export function CreatePaymentLinkPage(): JSX.Element {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void paymentsApi.GET("/me/merchant").then(({ data }) => {
      if (data) setCurrency(data.currency);
    });
  }, []);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { data, error: apiError } = await paymentsApi.POST("/me/payment-links", {
      body: { amount: parsedAmount, currency },
    });
    setSubmitting(false);
    if (apiError || !data) {
      setError(apiError?.message ?? "Could not generate the payment link.");
      return;
    }
    navigate(`/payment-links/${data.id}`);
  }

  return (
    <PageContent maxWidth={480}>
      <PageTitle>
        <PageTitle.Header>New payment link</PageTitle.Header>
      </PageTitle>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Box component="form" onSubmit={handleSubmit}>
        <Form.Section>
          <Form.Stack spacing={2}>
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              fullWidth
            />
            <TextField
              select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              fullWidth
            >
              {CURRENCIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Form.Stack>
        </Form.Section>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            Generate link
          </Button>
        </Box>
      </Box>
    </PageContent>
  );
}
