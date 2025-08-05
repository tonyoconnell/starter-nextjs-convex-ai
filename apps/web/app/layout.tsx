import './globals.css';
import { Inter } from 'next/font/google';
import React from 'react';
import { ConvexClientProvider } from './providers';
import { AuthProvider } from '../components/auth/auth-provider';
import { ThemeProvider } from '../components/theme/theme-provider';
import { LoggingProvider } from '../components/logging/logging-provider';
import { VersionProvider } from '../components/dev/version-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Agentic Starter Template',
  description: 'A production-grade starter template for AI-native applications',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LoggingProvider>
              <ConvexClientProvider>
                <VersionProvider
                  showIndicator={true}
                  showFlashNotifications={true}
                  indicatorPosition="bottom-left"
                  maxVersions={20}
                >
                  {children}
                </VersionProvider>
              </ConvexClientProvider>
            </LoggingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
