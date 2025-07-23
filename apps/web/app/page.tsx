'use client';

import { useQuery } from 'convex/react';
import { api } from '../convex/api';
import { useAuth } from '../components/auth/auth-provider';
import { LogoutButton } from '../components/auth/logout-button';
import { Button } from '@starter/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@starter/ui';
import { Input } from '@starter/ui';
import Link from 'next/link';
import { useState } from 'react';
import { ThemeToggle } from '../components/theme/theme-toggle';

export default function HomePage() {
  const testMessage = useQuery(api.queries.getTestMessage);
  const testMessages = useQuery(api.queries.getTestMessages);
  const { user, isLoading } = useAuth();
  const [inputValue, setInputValue] = useState('');

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with theme toggle */}
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Welcome - Auto Deploy Test
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
              to the Agentic Starter Template
            </p>

            {/* Authentication Status */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🔐 Authentication Status
              </h3>
              {isLoading ? (
                <p className="text-yellow-600 dark:text-yellow-400">
                  Checking auth...
                </p>
              ) : user ? (
                <div className="space-y-3">
                  <p className="text-green-600 dark:text-green-400">
                    ✅ Signed in as {user.name}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Link
                      href="/protected"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Protected Area
                    </Link>
                    <LogoutButton />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    Not signed in
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-8 space-y-4">
              <div className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors">
                🚀 Next.js App Router + TypeScript + Tailwind CSS
              </div>

              {/* Convex Connection Test */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📡 Convex Connection Test
                </h3>

                {testMessage === undefined ? (
                  <p className="text-yellow-600 dark:text-yellow-400">
                    Loading...
                  </p>
                ) : testMessage === null ? (
                  <p className="text-red-600 dark:text-red-400">
                    Connection failed
                  </p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="text-green-600 dark:text-green-400">
                      ✅ Connected!
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Message: {testMessage.message}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Status: {testMessage.status}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Messages in DB: {testMessages?.length || 0}
                    </p>
                  </div>
                )}
              </div>

              {/* ShadCN Components Showcase */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    🎨 ShadCN Components Showcase
                  </h3>
                  <Link
                    href="/showcase"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View All Components →
                  </Link>
                </div>

                <div className="space-y-6">
                  {/* Button variants */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Button Components:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="default">Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive" size="sm">
                        Destructive
                      </Button>
                    </div>
                  </div>

                  {/* Input component */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Input Component:
                    </h4>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Type something..."
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                      />
                      {inputValue && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          You typed: {inputValue}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card component */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Card Component:
                    </h4>
                    <Card className="w-full max-w-sm mx-auto">
                      <CardHeader>
                        <CardTitle>Example Card</CardTitle>
                        <CardDescription>
                          This is a sample card using ShadCN components
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          All components are properly integrated and styled with
                          Tailwind CSS.
                        </p>
                        <div className="mt-4">
                          <Button variant="outline" size="sm">
                            Card Action
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
