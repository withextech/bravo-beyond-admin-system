"use client";

import { startTransition, useEffect, useRef } from "react";
import { signOut } from "@/app/login/actions";

const activityStorageKey = "bravo-admin-last-activity";

type SessionTimeoutProps = {
  inactivityMinutes?: number;
};

export function SessionTimeout({ inactivityMinutes = 60 }: SessionTimeoutProps) {
  const timeoutMs = Math.max(1, Math.trunc(inactivityMinutes)) * 60 * 1000;

  const timerRef = useRef<number | null>(null);
  const isSigningOutRef = useRef(false);

  useEffect(() => {
    function clearTimer() {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    function runSignOut() {
      if (isSigningOutRef.current) {
        return;
      }

      isSigningOutRef.current = true;
      clearTimer();
      startTransition(() => {
        void signOut();
      });
    }

    function getLastActivity() {
      const storedValue = Number(window.localStorage.getItem(activityStorageKey));
      return Number.isFinite(storedValue) && storedValue > 0 ? storedValue : Date.now();
    }

    function scheduleTimeout() {
      clearTimer();
      const elapsedMs = Date.now() - getLastActivity();
      const remainingMs = timeoutMs - elapsedMs;

      if (remainingMs <= 0) {
        runSignOut();
        return;
      }

      timerRef.current = window.setTimeout(runSignOut, remainingMs);
    }

    function recordActivity() {
      if (isSigningOutRef.current) {
        return;
      }

      window.localStorage.setItem(activityStorageKey, String(Date.now()));
      scheduleTimeout();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        scheduleTimeout();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === activityStorageKey) {
        scheduleTimeout();
      }
    }

    const activityEvents = ["click", "keydown", "scroll", "touchstart", "pointerdown", "focus"];

    recordActivity();
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      clearTimer();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
