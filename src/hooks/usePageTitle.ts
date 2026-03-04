import { useEffect } from "react";

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    const suffix = "NextWeb OS";
    document.title = title ? `${title} | ${suffix}` : suffix;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", description);
      }
    }

    return () => {
      document.title = suffix;
    };
  }, [title, description]);
}
