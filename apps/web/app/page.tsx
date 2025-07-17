"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/api";

export default function HomePage() {
  const testMessage = useQuery(api.queries.getTestMessage);
  const testMessages = useQuery(api.queries.getTestMessages);
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Welcome - Auto Deploy Test
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
              to the Agentic Starter Template
            </p>
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
                  <p className="text-yellow-600 dark:text-yellow-400">Loading...</p>
                ) : testMessage === null ? (
                  <p className="text-red-600 dark:text-red-400">Connection failed</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="text-green-600 dark:text-green-400">✅ Connected!</p>
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
