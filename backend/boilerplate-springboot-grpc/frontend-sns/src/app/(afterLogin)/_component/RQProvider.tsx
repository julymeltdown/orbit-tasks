"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

type Props = {
  children: ReactNode;
};

function RQProvider({children}: Props) {
  const [client] = useState(
    new QueryClient({
      defaultOptions: { // react-query defaults
        queries: {
          refetchOnWindowFocus: false,
          retryOnMount: true,
          refetchOnReconnect: false,
          retry: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

export default RQProvider;
