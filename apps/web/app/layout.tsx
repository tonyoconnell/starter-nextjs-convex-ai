import './globals.css';
import { Inter } from 'next/font/google';
import React from 'react';
import { ConvexClientProvider } from './providers';

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
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
