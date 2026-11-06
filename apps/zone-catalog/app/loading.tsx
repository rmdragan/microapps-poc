import { Container, Skeleton, SkeletonCard } from "@micro/ui";

export default function Loading() {
  return (
    <Container className="py-10">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-9 w-72" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </Container>
  );
}
