"use client";

import { Button, Container, ErrorState } from "@micro/ui";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-16">
      <ErrorState
        title="The overview could not load"
        description={
          error.message ||
          "The platform could not reach its data services. The rest of the zones may still be healthy."
        }
        action={
          <Button onClick={reset} variant="secondary">
            Try again
          </Button>
        }
      />
    </Container>
  );
}
