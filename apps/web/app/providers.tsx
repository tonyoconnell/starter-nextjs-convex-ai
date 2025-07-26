'use client';

import React, { useMemo } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { useAuth } from '../components/auth/auth-provider';
import { config } from '../lib/config';

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionToken } = useAuth();

  // Create a Convex client that automatically includes session tokens in all requests
  const authenticatedClient = useMemo(() => {
    const client = new ConvexReactClient(config.convexUrl!);
    
    // Override the client's query, mutation, and action methods to automatically inject sessionToken
    if (sessionToken) {
      const originalQuery = client.query.bind(client);
      const originalMutation = client.mutation.bind(client);
      const originalAction = client.action.bind(client);

      // Override query method to inject sessionToken
      (client as any).query = (name: string, args: Record<string, unknown> = {}) => {
        return originalQuery(name, { ...args, sessionToken });
      };

      // Override mutation method to inject sessionToken
      (client as any).mutation = (name: string, args: Record<string, unknown> = {}) => {
        return originalMutation(name, { ...args, sessionToken });
      };

      // Override action method to inject sessionToken
      (client as any).action = (name: string, args: Record<string, unknown> = {}) => {
        return originalAction(name, { ...args, sessionToken });
      };
    }
    
    return client;
  }, [sessionToken]);

  return <ConvexProvider client={authenticatedClient}>{children}</ConvexProvider>;
}
