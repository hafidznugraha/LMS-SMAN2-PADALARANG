import React from "react";

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      "altcha-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          challenge?: string;
          challengeurl?: string;
          auto?: "off" | "onfocus" | "onload" | "onsubmit";
          display?: "standard" | "bar" | "floating" | "overlay" | "invisible";
          language?: string;
          name?: string;
          theme?: string;
          type?: "native" | "checkbox" | "switch";
          workers?: number | string;
          configuration?: string;
        },
        HTMLElement
      >;
    }
  }
  namespace JSX {
    interface IntrinsicElements {
      "altcha-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          challenge?: string;
          challengeurl?: string;
          auto?: "off" | "onfocus" | "onload" | "onsubmit";
          display?: "standard" | "bar" | "floating" | "overlay" | "invisible";
          language?: string;
          name?: string;
          theme?: string;
          type?: "native" | "checkbox" | "switch";
          workers?: number | string;
          configuration?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
