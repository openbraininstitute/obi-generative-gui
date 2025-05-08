'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
      <SessionProvider refetchInterval={2 * 60}>
          {children}
      </SessionProvider>
  );
}
