"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            success: "!bg-emerald-50 !text-emerald-800 !border-emerald-200",
            error: "!bg-red-50 !text-red-800 !border-red-200",
          },
        }}
      />
    </QueryClientProvider>
  );
}