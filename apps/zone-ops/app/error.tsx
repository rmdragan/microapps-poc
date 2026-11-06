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
        title="Operations could not load"
        description={
          error.message ||
          "The operations data service did not answer. The shell and other zones are unaffected."
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
