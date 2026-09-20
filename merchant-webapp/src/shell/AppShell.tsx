// The signed-in app shell — the wireframes' `navbar "Merchant Payments"` +
// `sidebar "Dashboard -> Dashboard | Payment Links -> PaymentLinks |
// Transactions -> Transactions | Payouts -> Payouts"`, repeated identically on
// every F1 screen. ONE rail, its items each gated by <Can>, per
// thunder-authentication and wireframes/implementing.md — the DSL draws a
// different sidebar per role because it draws one role at a time.
import type { JSX } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  Header,
  Sidebar,
  Footer,
  UserMenu,
  ColorSchemeToggle,
  Divider,
} from "@wso2/oxygen-ui";
import { LayoutDashboard, Link2, Receipt, Wallet, LogOut, User } from "@wso2/oxygen-ui-icons-react";
import { Can, useAuthz, useHeldRoles } from "../authz/gates";
import { signOut } from "../authz/session";
import { APP_NAME } from "../appName";

function activeItemFor(pathname: string): string {
  if (pathname.startsWith("/payment-links")) return "payment-links";
  if (pathname.startsWith("/transactions")) return "transactions";
  if (pathname.startsWith("/payouts")) return "payouts";
  return "dashboard";
}

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { username } = useAuthz();
  const roles = useHeldRoles();
  const displayName = username || "Merchant";

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand onClick={() => navigate("/dashboard")}>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={displayName} />
              <UserMenu.Header name={displayName} email={displayName} role={roles[0]} />
              <UserMenu.Item icon={<User />} label="My business" onClick={() => navigate("/onboarding")} />
              <UserMenu.Logout icon={<LogOut />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={activeItemFor(pathname)}>
          <Sidebar.Nav>
            <Sidebar.Category>
              <Can op="GET /me/balance">
                <Sidebar.Item id="dashboard" link={<Link to="/dashboard" />}>
                  <Sidebar.ItemIcon>
                    <LayoutDashboard />
                  </Sidebar.ItemIcon>
                  <Sidebar.ItemLabel>Dashboard</Sidebar.ItemLabel>
                </Sidebar.Item>
              </Can>
              <Can op="GET /me/payment-links">
                <Sidebar.Item id="payment-links" link={<Link to="/payment-links" />}>
                  <Sidebar.ItemIcon>
                    <Link2 />
                  </Sidebar.ItemIcon>
                  <Sidebar.ItemLabel>Payment Links</Sidebar.ItemLabel>
                </Sidebar.Item>
              </Can>
              <Can op="GET /me/transactions">
                <Sidebar.Item id="transactions" link={<Link to="/transactions" />}>
                  <Sidebar.ItemIcon>
                    <Receipt />
                  </Sidebar.ItemIcon>
                  <Sidebar.ItemLabel>Transactions</Sidebar.ItemLabel>
                </Sidebar.Item>
              </Can>
              <Can op="GET /me/payouts">
                <Sidebar.Item id="payouts" link={<Link to="/payouts" />}>
                  <Sidebar.ItemIcon>
                    <Wallet />
                  </Sidebar.ItemIcon>
                  <Sidebar.ItemLabel>Payouts</Sidebar.ItemLabel>
                </Sidebar.Item>
              </Can>
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>© {new Date().getFullYear()} {APP_NAME}</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
