import { Button, Container, EmptyState } from "@micro/ui";
import { ZoneLink } from "@micro/ui/next";

export default function NotFound() {
  return (
    <Container className="py-16">
      <EmptyState
        title="That service is not in the catalog"
        description="It may have been renamed or retired. Head back to the catalog to see what is currently available."
        action={
          <Button asChild variant="secondary">
            <ZoneLink href="/catalog">Back to the catalog</ZoneLink>
          </Button>
        }
      />
    </Container>
  );
}
