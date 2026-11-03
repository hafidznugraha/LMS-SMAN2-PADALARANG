"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { getApiBaseUrl } from "@/lib/api";

export interface AltchaHandle {
  value: string | null;
  reset: () => void;
}

export interface AltchaProps {
  challengeUrl?: string;
  onStateChange?: (payload: string | null) => void;
  className?: string;
}

export const AltchaWidget = forwardRef<AltchaHandle, AltchaProps>(
  ({ challengeUrl, onStateChange, className = "" }, ref) => {
    const widgetRef = useRef<HTMLElement | null>(null);
    const [payload, setPayload] = useState<string | null>(null);

    const apiUrl = challengeUrl || `${getApiBaseUrl()}/auth/altcha-challenge`;

    useEffect(() => {
      import("altcha");
    }, []);

    useEffect(() => {
      const el = widgetRef.current;
      if (!el) return;

      const handleStateChange = (ev: Event) => {
        if ("detail" in ev) {
          const customEv = ev as CustomEvent<{ state: string; payload?: string }>;
          if (customEv.detail?.state === "verified" && customEv.detail.payload) {
            setPayload(customEv.detail.payload);
            onStateChange?.(customEv.detail.payload);
          } else if (
            customEv.detail?.state === "unverified" ||
            customEv.detail?.state === "expired" ||
            customEv.detail?.state === "error"
          ) {
            setPayload(null);
            onStateChange?.(null);
          }
        }
      };

      el.addEventListener("statechange", handleStateChange);
      return () => {
        el.removeEventListener("statechange", handleStateChange);
      };
    }, [onStateChange]);

    useImperativeHandle(
      ref,
      () => ({
        value: payload,
        reset: () => {
          setPayload(null);
          const el = widgetRef.current as any;
          if (el && typeof el.reset === "function") {
            el.reset();
          }
        },
      }),
      [payload]
    );

    const altchaConfig = JSON.stringify({
      hideFooter: true,
      strings: {
        label: "Saya bukan robot",
        verifying: "Memverifikasi...",
        verified: "Terverifikasi aman",
        error: "Gagal verifikasi. Silakan coba lagi.",
      },
    });

    return (
      <div className={`w-full flex justify-center items-center ${className}`}>
        <altcha-widget
          ref={widgetRef as any}
          challenge={apiUrl}
          auto="onfocus"
          configuration={altchaConfig}
          hidefooter="true"
          style={
            {
              "--altcha-max-width": "260px",
              "--altcha-border-radius": "16px",
              "--altcha-padding": "0.5rem 0.85rem",
              "--altcha-border-color": "#E2E8F0",
              "--altcha-color-base": "#F8FAFC",
              display: "block",
              margin: "0 auto",
            } as React.CSSProperties
          }
          className="mx-auto block"
        />
      </div>
    );
  }
);

AltchaWidget.displayName = "AltchaWidget";
