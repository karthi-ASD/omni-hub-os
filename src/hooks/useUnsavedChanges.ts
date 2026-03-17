import { useEffect, useCallback, useRef, useState } from "react";

const DRAFT_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

interface DraftEnvelope<T> {
  data: T;
  updatedAt: number;
  version: number;
}

/** Shallow-compare two flat objects — returns true if different */
function shallowDirty<T extends Record<string, any>>(a: T, b: T): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return true;
  for (const k of keysA) {
    const va = a[k];
    const vb = b[k];
    // For arrays / objects fall back to JSON (rare — most form fields are primitives)
    if (va !== vb) {
      if (typeof va === "object" || typeof vb === "object") {
        if (JSON.stringify(va) !== JSON.stringify(vb)) return true;
      } else {
        return true;
      }
    }
  }
  return false;
}

function readEnvelope<T>(key: string): DraftEnvelope<T> | null {
  try {
    const raw = localStorage.getItem(`draft:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Support legacy drafts (no envelope)
    if (parsed && typeof parsed === "object" && "data" in parsed && "updatedAt" in parsed) {
      return parsed as DraftEnvelope<T>;
    }
    // Legacy: wrap bare data
    return { data: parsed as T, updatedAt: Date.now(), version: 1 };
  } catch {
    localStorage.removeItem(`draft:${key}`);
    return null;
  }
}

function writeEnvelope<T>(key: string, data: T, version: number) {
  const envelope: DraftEnvelope<T> = { data, updatedAt: Date.now(), version };
  try {
    localStorage.setItem(`draft:${key}`, JSON.stringify(envelope));
  } catch {
    // quota exceeded — ignore
  }
}

/** Validate draft structure matches current value keys (guards against schema changes) */
function isStructureValid<T extends Record<string, any>>(draft: unknown, reference: T): draft is T {
  if (!draft || typeof draft !== "object") return false;
  const refKeys = Object.keys(reference);
  const draftKeys = Object.keys(draft as Record<string, unknown>);
  // At least 50% of expected keys must exist
  const overlap = refKeys.filter((k) => draftKeys.includes(k)).length;
  return overlap >= Math.ceil(refKeys.length * 0.5);
}

/**
 * Production-hardened draft persistence hook.
 *
 * Features:
 * - Debounced auto-save with versioning & timestamps
 * - 48-hour expiry
 * - Cross-tab conflict detection via storage events
 * - Shallow dirty check (avoids heavy JSON.stringify per render)
 * - Structure validation on restore
 * - beforeunload guard
 */
export function useUnsavedChanges<T extends Record<string, any>>(
  key: string,
  currentValues: T,
  options?: { debounceMs?: number; enabled?: boolean },
) {
  const { debounceMs = 5000, enabled = true } = options ?? {};
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [crossTabConflict, setCrossTabConflict] = useState(false);
  const initialRef = useRef<T>(currentValues);
  const versionRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = `draft:${key}`;

  // ── beforeunload guard ──
  useEffect(() => {
    if (!enabled || !isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, enabled]);

  // ── Shallow dirty check ──
  useEffect(() => {
    if (!enabled) return;
    setIsDirty(shallowDirty(currentValues, initialRef.current));
  }, [currentValues, enabled]);

  // ── Auto-save (debounced) with versioning ──
  useEffect(() => {
    if (!enabled || !isDirty) return;
    setIsSaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      versionRef.current += 1;
      writeEnvelope(key, currentValues, versionRef.current);
      setIsSaving(false);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentValues, isDirty, key, debounceMs, enabled]);

  // ── Cross-tab conflict detection ──
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: StorageEvent) => {
      if (e.key !== storageKey || !e.newValue) return;
      try {
        const remote = JSON.parse(e.newValue) as DraftEnvelope<T>;
        if (remote.version > versionRef.current) {
          setCrossTabConflict(true);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [storageKey, enabled]);

  // ── Expire stale drafts on mount ──
  useEffect(() => {
    const env = readEnvelope<T>(key);
    if (env && Date.now() - env.updatedAt > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(storageKey);
    } else if (env) {
      versionRef.current = env.version;
    }
  }, [key, storageKey]);

  const restoreDraft = useCallback((): T | null => {
    const env = readEnvelope<T>(key);
    if (!env) return null;
    if (Date.now() - env.updatedAt > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(storageKey);
      return null;
    }
    if (!isStructureValid(env.data, initialRef.current)) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return env.data;
  }, [key, storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setIsDirty(false);
    setIsSaving(false);
    setCrossTabConflict(false);
    initialRef.current = currentValues;
  }, [storageKey, currentValues]);

  const acceptRemoteDraft = useCallback(() => {
    const env = readEnvelope<T>(key);
    setCrossTabConflict(false);
    if (env) {
      versionRef.current = env.version;
      return env.data;
    }
    return null;
  }, [key]);

  const dismissConflict = useCallback(() => {
    setCrossTabConflict(false);
    versionRef.current += 1;
  }, []);

  const resetInitial = useCallback((values: T) => {
    initialRef.current = values;
    setIsDirty(false);
  }, []);

  return {
    isDirty,
    isSaving,
    crossTabConflict,
    restoreDraft,
    clearDraft,
    resetInitial,
    acceptRemoteDraft,
    dismissConflict,
  };
}
