import { useState, useCallback, useRef, useEffect } from "react";

export interface UseOtpInputOptions {
  /**
   * Number of OTP digits (default: 6).
   */
  length?: number;
  /**
   * Initial or controlled OTP state array.
   */
  initialOtp?: string[];
  /**
   * Prefix for input IDs, e.g. "otp-input", "signup-otp-input", "delete-otp-input".
   */
  idPrefix: string;
  /**
   * Callback fired whenever the OTP changes.
   */
  onChange?: (otp: string[], fullCode: string) => void;
  /**
   * Callback fired when all digits are filled.
   */
  onComplete?: (fullCode: string) => void;
}

export interface UseOtpInputReturn {
  otp: string[];
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  fullOtp: string;
  isComplete: boolean;
  applyFullOtp: (code: string) => void;
  resetOtp: () => void;
  focusFirstInput: () => void;
  focusInput: (index: number) => void;
  handleOtpChange: (index: number, value: string) => void;
  handleOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleOtpPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  getInputProps: (index: number, extraProps?: React.InputHTMLAttributes<HTMLInputElement>) => React.InputHTMLAttributes<HTMLInputElement> & {
    id: string;
    key: number;
  };
}

/**
 * Universal hook for multi-box OTP inputs supporting:
 * - Native iOS QuickType "one-time-code" keyboard autofill
 * - Android WebOTP / Gboard suggestions
 * - Desktop and mobile clipboard pasting
 * - Smooth manual single-digit typing with auto-advance and backspace navigation
 */
export function useOtpInput({
  length = 6,
  initialOtp,
  idPrefix,
  onChange,
  onComplete,
}: UseOtpInputOptions): UseOtpInputReturn {
  const [otp, setOtp] = useState<string[]>(() => {
    if (initialOtp && initialOtp.length === length) {
      return initialOtp;
    }
    return new Array(length).fill("");
  });

  const onChangeRef = useRef(onChange);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const focusInput = useCallback(
    (index: number) => {
      if (typeof document === "undefined") return;
      const target = document.getElementById(`${idPrefix}-${index}`) as HTMLInputElement | null;
      if (target) {
        target.focus();
        // Place cursor at end of input
        target.setSelectionRange?.(target.value.length, target.value.length);
      }
    },
    [idPrefix]
  );

  const focusFirstInput = useCallback(() => {
    focusInput(0);
  }, [focusInput]);

  /**
   * Distributes a full OTP string across the input boxes.
   */
  const applyFullOtp = useCallback(
    (code: string) => {
      if (!code) return;
      const cleanDigits = code.replace(/\D/g, "").slice(0, length);
      if (!cleanDigits) return;

      const newOtp = new Array(length).fill("");
      for (let i = 0; i < length; i++) {
        newOtp[i] = cleanDigits[i] || "";
      }

      setOtp(newOtp);
      const fullCode = newOtp.join("");
      onChangeRef.current?.(newOtp, fullCode);

      // Focus the last populated box (or the last box if all filled)
      const lastFilledIdx = Math.min(cleanDigits.length - 1, length - 1);
      focusInput(lastFilledIdx);

      if (cleanDigits.length === length) {
        onCompleteRef.current?.(fullCode);
      }
    },
    [length, focusInput]
  );

  const resetOtp = useCallback(() => {
    const emptyOtp = new Array(length).fill("");
    setOtp(emptyOtp);
    onChangeRef.current?.(emptyOtp, "");
    focusFirstInput();
  }, [length, focusFirstInput]);

  const handleOtpChange = useCallback(
    (index: number, rawValue: string) => {
      const digitsOnly = rawValue.replace(/\D/g, "");

      // Scenario A: Multi-character input from iOS QuickType autofill or Android paste
      if (digitsOnly.length > 1) {
        applyFullOtp(digitsOnly);
        return;
      }

      // Scenario B: Single digit typed
      const newOtp = [...otp];
      newOtp[index] = digitsOnly;
      setOtp(newOtp);

      const fullCode = newOtp.join("");
      onChangeRef.current?.(newOtp, fullCode);

      // Auto-advance focus to next input if digit entered
      if (digitsOnly && index < length - 1) {
        focusInput(index + 1);
      }

      if (fullCode.length === length) {
        onCompleteRef.current?.(fullCode);
      }
    },
    [otp, length, applyFullOtp, focusInput]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (!otp[index] && index > 0) {
          // If current input is empty, focus previous input and clear it
          e.preventDefault();
          const newOtp = [...otp];
          newOtp[index - 1] = "";
          setOtp(newOtp);
          onChangeRef.current?.(newOtp, newOtp.join(""));
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [otp, length, focusInput]
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text");
      applyFullOtp(pasted);
    },
    [applyFullOtp]
  );

  const fullOtp = otp.join("");
  const isComplete = fullOtp.length === length;

  const getInputProps = useCallback(
    (index: number, extraProps: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
      return {
        key: index,
        id: `${idPrefix}-${index}`,
        type: "text",
        inputMode: "numeric" as const,
        // Crucial for iOS Safari / Chrome on iOS: "one-time-code" on first input
        autoComplete: index === 0 ? ("one-time-code" as const) : ("off" as const),
        // Allow first input to accept up to full length when autofilled from OS suggestions
        maxLength: index === 0 ? length : 1,
        pattern: "\\d*",
        value: otp[index] || "",
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          handleOtpChange(index, e.target.value);
          extraProps.onChange?.(e);
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
          handleOtpKeyDown(index, e);
          extraProps.onKeyDown?.(e);
        },
        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
          handleOtpPaste(e);
          extraProps.onPaste?.(e);
        },
        ...extraProps,
      };
    },
    [idPrefix, length, otp, handleOtpChange, handleOtpKeyDown, handleOtpPaste]
  );

  return {
    otp,
    setOtp,
    fullOtp,
    isComplete,
    applyFullOtp,
    resetOtp,
    focusFirstInput,
    focusInput,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    getInputProps,
  };
}
