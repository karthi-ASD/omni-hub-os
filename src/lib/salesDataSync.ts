import { useEffect } from "react";

export type SalesDataScope =
  | "all"
  | "leads"
  | "clients"
  | "deals"
  | "follow-ups"
  | "proposals"
  | "dashboard"
  | "pipeline";

type SalesDataRefreshDetail = {
  scopes: SalesDataScope[];
  source?: string;
  timestamp: number;
};

const SALES_DATA_REFRESH_EVENT = "sales-data-refresh";

export function notifySalesDataChanged(scopes: SalesDataScope[] = ["all"], source?: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<SalesDataRefreshDetail>(SALES_DATA_REFRESH_EVENT, {
      detail: {
        scopes,
        source,
        timestamp: Date.now(),
      },
    }),
  );
}

export function forceRefreshSalesData() {
  notifySalesDataChanged(["all"], "manual-force-refresh");
}

export function useSalesDataAutoRefresh(
  refetch: () => void | Promise<void>,
  scopes: SalesDataScope[] = ["all"],
) {
  const scopeKey = scopes.slice().sort().join("|");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeout: ReturnType<typeof setTimeout> | null = null;

    const runRefetch = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        void refetch();
      }, 50);
    };

    const handleRefreshEvent = (event: Event) => {
      const detail = (event as CustomEvent<SalesDataRefreshDetail>).detail;
      const changedScopes = detail?.scopes || ["all"];

      if (
        changedScopes.includes("all") ||
        scopes.includes("all") ||
        changedScopes.some((scope) => scopes.includes(scope))
      ) {
        runRefetch();
      }
    };

    window.addEventListener(SALES_DATA_REFRESH_EVENT, handleRefreshEvent as EventListener);

    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener(SALES_DATA_REFRESH_EVENT, handleRefreshEvent as EventListener);
    };
  }, [refetch, scopeKey]);
}
