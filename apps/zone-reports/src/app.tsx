import { zoneByApp } from "@micro/routing";
import { AppShell, Button, Container, EmptyState, Providers } from "@micro/ui";
import { Route, Router, Switch } from "wouter";
import { api } from "./api";
import { useAsync } from "./hooks";
import { CouriersPage } from "./pages/couriers";
import { OverviewPage } from "./pages/overview";
import { ReportsLink } from "./zone-link";

const zone = zoneByApp("zone-reports");

function NotFoundPage() {
  return (
    <Container className="py-16">
      <EmptyState
        title="Nothing at this address"
        description="The reports zone only has an overview and a courier load view."
        action={
          <Button asChild variant="secondary">
            <ReportsLink href="/reports">Back to reports</ReportsLink>
          </Button>
        }
      />
    </Container>
  );
}

export function App() {
  const me = useAsync(() => api.me(), []);
  const user = me.loading ? undefined : me.data;

  return (
    <Providers user={user} zone={{ id: zone.id, basePath: zone.path }}>
      <Router base={zone.path}>
        <AppShell
          zone={{ id: zone.id }}
          build={{
            app: zone.app,
            version: __BUILD_INFO__,
            mode: import.meta.env.DEV ? "development" : "production",
          }}
          linkComponent={ReportsLink}
        >
          <Switch>
            <Route path="/" component={OverviewPage} />
            <Route path="/couriers" component={CouriersPage} />
            <Route component={NotFoundPage} />
          </Switch>
        </AppShell>
      </Router>
    </Providers>
  );
}
