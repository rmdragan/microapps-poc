import { Container, Skeleton, SkeletonCard } from "@micro/ui";

export default function Loading() {
  return (
    <Container className="py-10">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_0.55fr]">
        <div className="space-y-5">
          <SkeletonCard rows={4} />
          <SkeletonCard rows={5} />
        </div>
        <div className="space-y-5">
          <SkeletonCard rows={4} />
          <SkeletonCard rows={3} />
        </div>
      </div>
    </Container>
  );
}
