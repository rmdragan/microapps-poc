import { Button, Container, EmptyState } from "@micro/ui";
import { ZoneLink } from "@micro/ui/next";

export default function NotFound() {
  return (
    <Container className="py-16">
      <EmptyState
        title="No operations page at this address"
        description="The operations zone only has routing rules and the audit trail."
        action={
          <Button asChild variant="secondary">
            <ZoneLink href="/ops">Back to routing rules</ZoneLink>
          </Button>
        }
      />
    </Container>
  );
}
