"use client"

import { useState } from 'react'
import type { FC, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from "react";
import Header from "@/components/common/header"

interface RootProps {
  children: ReactNode;
}

const Root: FC<RootProps> = ({ children }) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            })
    )  
    
    return (
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen flex flex-col">
            <main className="flex min-h-0 flex-1 flex-col">
              <Header />
              {children}
            </main>
          </div>
        </QueryClientProvider>
    )
}

export default Root