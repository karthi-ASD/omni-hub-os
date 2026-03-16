import { usePageTitle } from "@/hooks/usePageTitle";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const DealRoomPage = lazy(() => import("@/pages/DealRoomPage"));

const Loading = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
  </div>
);

export default function SalesProposalsPage() {
  usePageTitle("Proposals");

  return (
    <Suspense fallback={<Loading />}>
      <DealRoomPage />
    </Suspense>
  );
}
