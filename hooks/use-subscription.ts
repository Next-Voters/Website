"use client";

import { useEffect, useState } from "react";
import { getSubscriptionStatus } from "@/server-actions/get-subscription-status";

interface SubscriptionState {
  isPro: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    getSubscriptionStatus().then((result) => {
      setState({ ...result, isLoading: false });
    });
  }, []);

  return state;
}
