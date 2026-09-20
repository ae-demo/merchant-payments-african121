// wireframes.dsl: screen RequestPayout — available balance text, Amount
// input (capped at balance), Destination type select, Account/wallet number
// input, Cancel -> Payouts, "Submit request" primary -> Payouts.
import { useEffect, useState, type JSX, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Form, MenuItem, PageContent, PageTitle, TextField, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { formatMoney } from "../format";

type DestinationType = "bank" | "mobile-wallet";

export function RequestPayoutPage(): JSX.Element {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<{ amount: number; currency: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [destinationType, setDestinationType] = useState<DestinationType>("bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void paymentsApi.GET("/me/balance").then(({ data }) => {
      if (data) setBalance({ amount: data.amount, currency: data.currency });
    });
  }, []);

  const parsedAmount = Number(amount);
  const overBalance = balance !== null && parsedAmount > balance.amount;

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (overBalance) {
      setError("The amount cannot exceed your available balance.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: apiError } = await paymentsApi.POST("/me/payouts", {
      body: {
        amount: parsedAmount,
        destinationType,
        ...(destinationType === "bank"
          ? { bankAccountNumber: accountNumber }
          : { mobileWalletNumber: accountNumber }),
      },
    });
    setSubmitting(false);
    if (apiError) {
      setError(apiError.message ?? "Could not submit the payout request.");
      return;
    }
    navigate("/payouts");
  }

  return (
    <PageContent maxWidth={480}>
      <PageTitle>
        <PageTitle.Header>Request payout</PageTitle.Header>
      </PageTitle>
      <Typography sx={{ mb: 2 }}>
        Available balance: {balance ? formatMoney(balance.amount, balance.currency) : "…"}
      </Typography>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Box component="form" onSubmit={handleSubmit}>
        <Form.Section>
          <Form.Stack spacing={2}>
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={overBalance}
              helperText={overBalance ? "Exceeds your available balance." : undefined}
              required
              fullWidth
            />
            <TextField
              select
              label="Destination type (Bank / Mobile Wallet)"
              value={destinationType}
              onChange={(e) => setDestinationType(e.target.value as DestinationType)}
              fullWidth
            >
              <MenuItem value="bank">Bank</MenuItem>
              <MenuItem value="mobile-wallet">Mobile Wallet</MenuItem>
            </TextField>
            <TextField
              label="Account / wallet number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              fullWidth
            />
          </Form.Stack>
        </Form.Section>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate("/payouts")}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting || overBalance}>
            Submit request
          </Button>
        </Box>
      </Box>
    </PageContent>
  );
}
