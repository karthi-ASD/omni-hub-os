import { useEffect, useCallback, useRef, useState } from "react";

/**
 * Hook to protect unsaved form data:
 * - Warns on browser refresh / tab close
 * - Auto-saves drafts to localStorage (debounced)
 * - Restores drafts on mount
 */
export function useUnsavedChanges<T extends Record<string, any>>(
  key: string,
  currentValues: T,
  options?: { debounceMs?: number; enabled?: boolean },
) {
  const { debounceMs = 5000, enabled = true } = options ?? {};
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initialRef = useRef<T>(currentValues);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Browser beforeunload guard
  useEffect(() => {
    if (!enabled || !isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, enabled]);

  // Mark dirty when values change from initial
  useEffect(() => {
    if (!enabled) return;
    const changed = JSON.stringify(currentValues) !== JSON.stringify(initialRef.current);
    setIsDirty(changed);
  }, [currentValues, enabled]);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!enabled || !isDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`draft:${key}`, JSON.stringify(currentValues));
      } catch {
        // quota exceeded – ignore
      }
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentValues, isDirty, key, debounceMs, enabled]);

  const restoreDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(`draft:${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(`draft:${key}`);
    setIsDirty(false);
    initialRef.current = currentValues;
  }, [key, currentValues]);

  const resetInitial = useCallback((values: T) => {
    initialRef.current = values;
    setIsDirty(false);
  }, []);

  return { isDirty, restoreDraft, clearDraft, resetInitial };
}
