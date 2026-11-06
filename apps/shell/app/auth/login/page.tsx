import { Button, Card, Container, LogoMark } from "@micro/ui";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo = "/" } = await searchParams;
  const safe =
    returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";

  return (
    <Container className="grid min-h-[70vh] place-items-center py-12">
      <Card className="w-full max-w-md p-7">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-sm font-semibold text-ink">Relay</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
              Single sign-on
            </p>
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in to Relay</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          This proof of concept stands in for the identity provider. In production, the
          cluster edge starts the SSO flow and sets a session cookie for the whole domain.
        </p>

        <form method="post" action="/auth/login/callback" className="mt-6">
          <input type="hidden" name="returnTo" value={safe} />
          <Button type="submit" variant="accent" className="w-full">
            Continue as Robin Vale
          </Button>
        </form>

        <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-ink-mute">
          <ShieldCheck aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" />
          The cookie is httpOnly. Zones only ever see the identity headers the edge injects.
        </p>

        <div className="mt-6 border-t border-line pt-4 text-center">
          <a href="/" className="text-xs font-medium text-ink-soft hover:text-ink">
            Back to overview
          </a>
        </div>
      </Card>
    </Container>
  );
}
