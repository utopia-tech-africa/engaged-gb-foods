"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";
import { useNetworkOnline } from "@/hooks/use-network-online";
import { flushFieldOutbox } from "@/lib/field/field-offline-flush";

/** Flushes the field outbox whenever the device is online and a user is signed in. */
export const FieldOfflineSyncListener = (): null => {
  const queryClient = useQueryClient();
  const online = useNetworkOnline();
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!online || !accessToken) {
      return;
    }
    void flushFieldOutbox(queryClient);
  }, [online, accessToken, queryClient]);

  return null;
};
