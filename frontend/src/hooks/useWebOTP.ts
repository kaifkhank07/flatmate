import { useEffect, useRef, useCallback, useState } from "react";

export interface UseWebOTPOptions {
  /**
   * Whether WebOTP should actively listen for incoming SMS messages.
   * Default: true
   */
  enabled?: boolean;
  /**
   * Changing this key (e.g. resend count or timestamp) restarts the WebOTP listener.
   */
  triggerKey?: string | number;
  /**
   * Callback fired when an OTP is successfully retrieved from SMS.
   */
  onReceiveOTP: (otp: string) => void;
  /**
   * Optional error callback (AbortErrors are filtered out automatically).
   */
  onError?: (error: unknown) => void;
}

export interface UseWebOTPReturn {
  /**
   * Whether the current browser supports the WebOTP API (OTPCredential in window).
   */
  isSupported: boolean;
  /**
   * Manually abort the current active SMS listener.
   */
  stop: () => void;
  /**
   * Manually restart the SMS listener with a fresh AbortController.
   */
  restart: () => void;
}

/**
 * Custom hook for the WebOTP API (Android Chrome, Edge, Samsung Internet).
 * Handles feature detection, AbortController lifecycle, duplicate listener prevention,
 * and automatic cleanup on unmount or step transitions.
 */
export function useWebOTP({
  enabled = true,
  triggerKey,
  onReceiveOTP,
  onError,
}: UseWebOTPOptions): UseWebOTPReturn {
  const [isSupported, setIsSupported] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onReceiveRef = useRef(onReceiveOTP);
  const onErrorRef = useRef(onError);

  // Keep callback refs updated to avoid re-triggering listeners on parent render
  useEffect(() => {
    onReceiveRef.current = onReceiveOTP;
  }, [onReceiveOTP]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Check WebOTP support once on client mount
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "OTPCredential" in window &&
      "credentials" in navigator &&
      typeof navigator.credentials?.get === "function"
    ) {
      setIsSupported(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !("OTPCredential" in window) ||
      !("credentials" in navigator) ||
      typeof navigator.credentials?.get !== "function"
    ) {
      return;
    }

    // Abort any existing listener before starting a new one
    stop();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: controller.signal,
      } as CredentialRequestOptions)
      .then((content: any) => {
        if (content && typeof content.code === "string") {
          const cleanDigits = content.code.replace(/\D/g, "").slice(0, 6);
          if (cleanDigits.length === 6) {
            onReceiveRef.current(cleanDigits);
          }
        }
      })
      .catch((err: any) => {
        // AbortError is triggered when we cancel previous listener or component unmounts; ignore cleanly
        if (err?.name === "AbortError") {
          return;
        }
        onErrorRef.current?.(err);
      })
      .finally(() => {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      });
  }, [stop]);

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, triggerKey, startListening, stop]);

  return {
    isSupported,
    stop,
    restart: startListening,
  };
}
