// The signed-in app shell — wireframes.dsl's `navbar "Payments Admin"` +
// `sidebar "Onboarding -> OnboardingQueue | Transactions -> AllTransactions |
// Payouts -> AllPayouts | Disputes -> Disputes"`, repeated on every screen.
// One rail; each item is wrapped in <Can> so it reproduces the wireframe's
// per-role picture and also covers a caller holding more than one role.
import type { JSX } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  AppShell,
  Header,
  Sidebar,
  Footer,
  UserMenu,
  ColorSchemeToggle,
  Divider,
} from "@wso2/oxygen-ui";
import {
  ClipboardList,
  Receipt,
  Wallet,
  AlertTriangle,
} from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { Can, useAuthz, useHeldRoles } from "../authz/gates";
import { signOut } from "../authz/session";
import { SCREEN_ROUTES } from "../authz/screens";

const NAV_ITEMS = [
  { key: "onboarding", label: "Onboarding", path: "/onboarding", icon: <ClipboardList /> },
  { key: "transactions", label: "Transactions", path: "/transactions", icon: <Receipt /> },
  { key: "payouts", label: "Payouts", path: "/payouts", icon: <Wallet /> },
  { key: "disputes", label: "Disputes", path: "/disputes", icon: <AlertTriangle /> },
] as const;

/** Every nav item's screen must declare a load operation to gate on — fail
 * loudly at module load rather than silently showing an ungated link. */
function screenLoads(key: string) {
  const screen = SCREEN_ROUTES.find((s) => s.key === key);
  if (!screen || screen.loads === null) {
    throw new Error(`AppShell: nav item "${key}" has no matching gated screen in screens.ts`);
  }
  return screen.loads;
}

function activeKey(pathname: string): string {
  const found = NAV_ITEMS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  return found?.key ?? "";
}

export default function AppLayout(): JSX.Element {
  const { pathname } = useLocation();
  const { username } = useAuthz();
  const roles = useHeldRoles();
  const active = activeKey(pathname);

  const handleSignOut = () => {
    void signOut();
  };

  return (
    <AppShell>
      <AppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Platform Admin"} showName />
              <UserMenu.Header
                name={username || "Platform Admin"}
                email={username}
                role={roles[0] ?? undefined}
              />
              <UserMenu.Logout onClick={handleSignOut} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </AppShell.Navbar>

      <AppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            <Sidebar.Category>
              {NAV_ITEMS.map((item) => (
                <Can key={item.key} op={screenLoads(item.key)}>
                  <Sidebar.Item id={item.key} link={<Link to={item.path} />}>
                    <Sidebar.ItemIcon>{item.icon}</Sidebar.ItemIcon>
                    <Sidebar.ItemLabel>{item.label}</Sidebar.ItemLabel>
                  </Sidebar.Item>
                </Can>
              ))}
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </AppShell.Sidebar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </AppShell.Footer>
    </AppShell>
  );
}
