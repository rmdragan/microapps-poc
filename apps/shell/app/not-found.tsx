import { Button, Container, ErrorState } from "@micro/ui";

export default function NotFound() {
  return (
    <Container className="py-16">
      <ErrorState
        title="There is nothing at this address"
        description="The overview only knows about the platform itself. Try one of the zones from the navigation above."
        action={
          <Button asChild variant="secondary">
            <a href="/">Back to overview</a>
          </Button>
        }
      />
    </Container>
  );
}
