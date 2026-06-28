"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DraftPayload<T> = {
  version: number;
  expiresAt: number;
  data: T;
};

type UseFormDraftOptions<T> = {
  key: string | null | undefined;
  value: T;
  enabled?: boolean;
  storage?: "local" | "session";
  debounceMs?: number;
  expiresInMs?: number;
  isSignificant?: (value: T) => boolean;
  sanitize?: (value: T) => T;
  onRestore?: (value: T) => void;
};

const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;

function getStorage(type: "local" | "session") {
  if (typeof window === "undefined") {
    return null;
  }
  return type === "session" ? window.sessionStorage : window.localStorage;
}

function safeParse<T>(raw: string | null): DraftPayload<T> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DraftPayload<T>;
    if (!parsed || parsed.version !== 1 || typeof parsed.expiresAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useFormDraft<T>({
  key,
  value,
  enabled = true,
  storage = "local",
  debounceMs = 600,
  expiresInMs = DEFAULT_EXPIRY_MS,
  isSignificant = () => true,
  sanitize = (current) => current,
  onRestore,
}: UseFormDraftOptions<T>) {
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);
  const restoredRef = useRef(false);
  const submittedRef = useRef(false);
  const onRestoreRef = useRef(onRestore);
  const storageRef = useMemo(() => getStorage(storage), [storage]);
  const significant = enabled && Boolean(key) && isSignificant(value);

  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);

  useEffect(() => {
    setRestored(false);
    setReady(false);
    restoredRef.current = false;
    submittedRef.current = false;

    if (!enabled || !key || !storageRef) {
      setReady(true);
      return;
    }

    const payload = safeParse<T>(storageRef.getItem(key));
    if (!payload) {
      setReady(true);
      return;
    }

    if (payload.expiresAt <= Date.now()) {
      storageRef.removeItem(key);
      setReady(true);
      return;
    }

    restoredRef.current = true;
    onRestoreRef.current?.(payload.data);
    setRestored(true);
    setReady(true);
  }, [enabled, key, storageRef]);

  useEffect(() => {
    if (!ready || !enabled || !key || !storageRef || submittedRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!isSignificant(value)) {
        storageRef.removeItem(key);
        return;
      }

      const payload: DraftPayload<T> = {
        version: 1,
        expiresAt: Date.now() + expiresInMs,
        data: sanitize(value),
      };
      storageRef.setItem(key, JSON.stringify(payload));
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, enabled, expiresInMs, isSignificant, key, ready, sanitize, storageRef, value]);

  useEffect(() => {
    if (!significant || submittedRef.current) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [significant]);

  function clearDraft() {
    submittedRef.current = true;
    if (key && storageRef) {
      storageRef.removeItem(key);
    }
    setRestored(false);
  }

  return {
    restored,
    clearDraft,
    hasDirtyDraft: significant,
  };
}
